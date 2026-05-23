/**
 * Unit tests for RSS feed generation
 * Testing the functionality similar to rss.xml.ts
 */

// Mock dependencies before importing
jest.mock("@astrojs/rss", () => ({
  __esModule: true,
  default: jest.fn((options) => ({
    body: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><title>${options.title}</title></rss>`,
    headers: new Headers({'Content-Type': 'application/xml'}),
    status: 200
  }))
}));

jest.mock("@/data/post", () => ({
  getAllPosts: jest.fn()
}));

jest.mock("@/site-config", () => ({
  siteConfig: {
    title: 'Test Site Title',
    description: 'Test Site Description',
  }
}));

// Import after mocking
import rss from "@astrojs/rss";
import { siteConfig } from "@/site-config";
import { getAllPosts } from "@/data/post";

const mockSiteUrl = 'https://example.com';

// Simulate the RSS generation function without using import.meta
const generateRssFeed = async () => {
  const posts = await getAllPosts();

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: mockSiteUrl, // Using a mock URL instead of import.meta.env.SITE
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `posts/${post.slug}`,
    })),
  });
};

const mockPosts = [
  {
    data: {
      title: 'Test Post 1',
      description: 'Description for test post 1',
      publishDate: new Date('2023-01-01'),
    },
    slug: 'test-post-1'
  },
  {
    data: {
      title: 'Test Post 2',
      description: 'Description for test post 2',
      publishDate: new Date('2023-01-02'),
    },
    slug: 'test-post-2'
  }
];

describe('RSS Feed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllPosts as jest.MockedFunction<typeof getAllPosts>).mockResolvedValue(mockPosts);
  });

  it('should return a valid RSS response', async () => {
    const response = await generateRssFeed();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/xml');
    expect(response.body).toBeDefined();
  });

  it('should call getAllPosts to fetch posts', async () => {
    const mockGetAllPosts = getAllPosts as jest.MockedFunction<typeof getAllPosts>;
    mockGetAllPosts.mockResolvedValue(mockPosts);

    await generateRssFeed();

    expect(mockGetAllPosts).toHaveBeenCalledTimes(1);
  });

  it('should use siteConfig for title and description', async () => {
    const mockRss = rss as jest.MockedFunction<any>;
    const mockGetAllPosts = getAllPosts as jest.MockedFunction<typeof getAllPosts>;
    mockGetAllPosts.mockResolvedValue(mockPosts);

    await generateRssFeed();

    expect(mockRss).toHaveBeenCalledWith(
      expect.objectContaining({
        title: siteConfig.title,
        description: siteConfig.description,
      })
    );
  });

  it('should use the site URL for the site property', async () => {
    const mockRss = rss as jest.MockedFunction<any>;
    const mockGetAllPosts = getAllPosts as jest.MockedFunction<typeof getAllPosts>;
    mockGetAllPosts.mockResolvedValue(mockPosts);

    await generateRssFeed();

    expect(mockRss).toHaveBeenCalledWith(
      expect.objectContaining({
        site: mockSiteUrl,
      })
    );
  });

  it('should map posts correctly to RSS items', async () => {
    const mockRss = rss as jest.MockedFunction<any>;
    const mockGetAllPosts = getAllPosts as jest.MockedFunction<typeof getAllPosts>;
    mockGetAllPosts.mockResolvedValue(mockPosts);

    await generateRssFeed();

    expect(mockRss).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          {
            title: 'Test Post 1',
            description: 'Description for test post 1',
            pubDate: new Date('2023-01-01'),
            link: 'posts/test-post-1'
          },
          {
            title: 'Test Post 2',
            description: 'Description for test post 2',
            pubDate: new Date('2023-01-02'),
            link: 'posts/test-post-2'
          }
        ]
      })
    );
  });

  it('should handle empty posts array', async () => {
    const mockRss = rss as jest.MockedFunction<any>;
    const mockGetAllPosts = getAllPosts as jest.MockedFunction<typeof getAllPosts>;
    mockGetAllPosts.mockResolvedValue([]);

    await generateRssFeed();

    expect(mockRss).toHaveBeenCalledWith(
      expect.objectContaining({
        items: []
      })
    );
  });

  it('should format links correctly as relative paths', async () => {
    const mockRss = rss as jest.MockedFunction<any>;
    const mockGetAllPosts = getAllPosts as jest.MockedFunction<typeof getAllPosts>;
    mockGetAllPosts.mockResolvedValue(mockPosts);

    await generateRssFeed();

    const calledWithArg = (mockRss as jest.Mock).mock.calls[0][0];
    const actualLinks = calledWithArg.items.map((item: any) => item.link);
    const expectedLinks = mockPosts.map(post => `posts/${post.slug}`);

    expect(actualLinks).toEqual(expectedLinks);
  });
});