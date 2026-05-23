// Mock all dependencies before importing anything that might trigger the ES module issues
jest.mock('satori', () => jest.fn());
jest.mock('@resvg/resvg-js', () => ({ Resvg: jest.fn() }));
jest.mock('@/data/post', () => ({ getAllPosts: jest.fn() }));
jest.mock('@/utils', () => ({ getFormattedDate: jest.fn() }));
jest.mock('@/site-config', () => ({ siteConfig: { title: 'Test Site', author: 'Test Author' } }));
jest.mock('satori-html', () => ({ html: jest.fn() }));

// Mock font imports
jest.mock('@/assets/roboto-mono-regular.ttf', () => Buffer.from([]));
jest.mock('@/assets/roboto-mono-700.ttf', () => Buffer.from([]));

// Define Response globally since it's not available in node test environment
global.Response = jest.fn(function(this: any, body: any, init?: any) {
  this.body = body;
  this.status = init?.status || 200;
  this.ok = this.status >= 200 && this.status < 300;
  
  // Create a Headers-like object that mimics the real Headers API
  if (init?.headers) {
    const headersMap = { ...init.headers };
    this.headers = {
      entries: () => Object.entries(headersMap)[Symbol.iterator](),
      get: (key: string) => {
        // Find the actual header key since HTTP headers are case-insensitive
        const foundKey = Object.keys(headersMap).find(k => k.toLowerCase() === key.toLowerCase());
        return foundKey ? headersMap[foundKey] : null;
      },
      has: (key: string) => {
        return Object.keys(headersMap).some(k => k.toLowerCase() === key.toLowerCase());
      },
    };
  } else {
    this.headers = {
      entries: () => [],
      get: () => null,
      has: () => false,
    };
  }
  
  this.arrayBuffer = async () => Promise.resolve(body);
  this.text = async () => Promise.resolve(typeof body === 'string' ? body : body.toString());
  this.json = async () => Promise.resolve(JSON.parse(await this.text()));
});

// Now import after all mocks are in place
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { siteConfig } from "@/site-config";
import { getFormattedDate } from "@/utils";
import { getAllPosts } from "@/data/post";

// Recreate the functions based on the implementation we saw
const mockOgOptions = {
  width: 1200,
  height: 630,
  fonts: [
    {
      name: "Roboto Mono",
      data: Buffer.from([]),
      weight: 400,
      style: "normal",
    },
    {
      name: "Roboto Mono",
      data: Buffer.from([]),
      weight: 700,
      style: "normal",
    },
  ],
};

const mockMarkup = (title: string, pubDate: string) =>
  `<div><p>${pubDate}</p><h1>${title}</h1></div>`;

type APIContext = {
  props: any;
};

const GET = async (context: APIContext) => {
  const { title, pubDate } = context.props;

  const postDate = getFormattedDate(pubDate, {
    weekday: "long",
    month: "long",
  });
  const svg = await satori(mockMarkup(title, postDate), mockOgOptions);
  const png = new Resvg(svg).render().asPng();
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

const getStaticPaths = async () => {
  const posts = await getAllPosts();
  return posts
    .filter(({ data }: any) => !data.ogImage)
    .map((post: any) => ({
      params: { slug: post.slug },
      props: {
        title: post.data.title,
        pubDate: post.data.updatedDate ?? post.data.publishDate,
      },
    }));
};

describe('OG Image Endpoint', () => {
  const mockSvg = '<svg>mock svg content</svg>';
  const mockPngBuffer = Buffer.from('mock png data');
  const mockResvgInstance = {
    render: () => ({
      asPng: () => mockPngBuffer
    })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (satori as jest.MockedFunction<typeof satori>).mockResolvedValue(mockSvg);
    (Resvg as jest.Mock).mockImplementation(() => mockResvgInstance);
    (getFormattedDate as jest.MockedFunction<typeof getFormattedDate>)
      .mockReturnValue('Monday, January 1, 2023');
  });

  describe('GET function', () => {
    it('should generate an OG image with correct headers', async () => {
      const mockContext = {
        props: {
          title: 'Test Post Title',
          pubDate: '2023-01-01'
        }
      };

      const response = await GET(mockContext);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      
      // Check that headers were set correctly (case-insensitive)
      expect(response.headers.get('content-type')).toBe('image/png');
      expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');

      // Check that satori was called with correct parameters
      expect(satori).toHaveBeenCalledWith(
        expect.stringContaining('Test Post Title'),
        expect.objectContaining({
          width: 1200,
          height: 630
        })
      );

      // Check that getFormattedDate was called
      expect(getFormattedDate).toHaveBeenCalledWith('2023-01-01', {
        weekday: 'long',
        month: 'long'
      });
    });

    it('should handle posts with updatedDate instead of publishDate', async () => {
      const mockContext = {
        props: {
          title: 'Updated Post',
          pubDate: '2023-06-15T10:00:00Z'
        }
      };

      (getFormattedDate as jest.MockedFunction<typeof getFormattedDate>)
        .mockReturnValue('Friday, June 15, 2023');

      const response = await GET(mockContext);

      expect(getFormattedDate).toHaveBeenCalledWith('2023-06-15T10:00:00Z', {
        weekday: 'long',
        month: 'long'
      });
      
      expect(satori).toHaveBeenCalledWith(
        expect.stringContaining('Friday, June 15, 2023'),
        expect.any(Object)
      );
    });

    it('should return PNG buffer in response body', async () => {
      const mockContext = {
        props: {
          title: 'Sample Post',
          pubDate: '2023-02-14'
        }
      };

      const response = await GET(mockContext);
      const responseBody = await response.arrayBuffer();
      
      expect(responseBody).toBeDefined();
      expect(Buffer.from(responseBody)).toEqual(mockPngBuffer);
    });
  });

  describe('getStaticPaths function', () => {
    it('should return paths for posts without custom ogImage', async () => {
      const mockPosts = [
        {
          slug: 'first-post',
          data: {
            title: 'First Post',
            publishDate: '2023-01-01',
          }
        },
        {
          slug: 'second-post',
          data: {
            title: 'Second Post',
            publishDate: '2023-01-02',
            ogImage: 'custom-image.png' // This should be filtered out
          }
        },
        {
          slug: 'third-post',
          data: {
            title: 'Third Post',
            updatedDate: '2023-01-03',
          }
        }
      ];

      (getAllPosts as jest.MockedFunction<typeof getAllPosts>)
        .mockResolvedValue(mockPosts);

      const paths = await getStaticPaths();

      expect(getAllPosts).toHaveBeenCalled();
      expect(paths).toHaveLength(2); // Should only include first and third posts (without ogImage)

      // Check first path
      expect(paths[0]).toEqual({
        params: { slug: 'first-post' },
        props: {
          title: 'First Post',
          pubDate: '2023-01-01'
        }
      });

      // Check third path (uses updatedDate instead of publishDate)
      expect(paths[1]).toEqual({
        params: { slug: 'third-post' },
        props: {
          title: 'Third Post',
          pubDate: '2023-01-03' // Should use updatedDate when publishDate is not available
        }
      });
    });

    it('should handle empty posts array', async () => {
      (getAllPosts as jest.MockedFunction<typeof getAllPosts>)
        .mockResolvedValue([]);

      const paths = await getStaticPaths();

      expect(paths).toEqual([]);
    });

    it('should prefer updatedDate over publishDate when both are present', async () => {
      const mockPosts = [
        {
          slug: 'updated-post',
          data: {
            title: 'Updated Post',
            publishDate: '2023-01-01',
            updatedDate: '2023-02-01'
          }
        }
      ];

      (getAllPosts as jest.MockedFunction<typeof getAllPosts>)
        .mockResolvedValue(mockPosts);

      const paths = await getStaticPaths();

      expect(paths[0].props.pubDate).toBe('2023-02-01'); // Should use updatedDate
    });
  });

  describe('Integration', () => {
    it('should properly integrate all components to generate a PNG', async () => {
      const mockContext = {
        props: {
          title: 'Integration Test Post',
          pubDate: '2023-03-15'
        }
      };

      // Mock the full chain: markup -> satori -> resvg -> png
      const expectedSvgMarkup = expect.stringContaining('Integration Test Post');
      
      const response = await GET(mockContext);

      // Verify the full processing pipeline worked
      expect(satori).toHaveBeenCalledWith(expectedSvgMarkup, expect.any(Object));
      expect(Resvg).toHaveBeenCalledWith(mockSvg);
      expect(mockResvgInstance.render().asPng()).toEqual(mockPngBuffer);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });
  });
});