// Mock the external dependencies before importing the module
jest.mock('reading-time', () => {
  return jest.fn((text) => ({
    text: `${Math.ceil(text.length / 200)} min read`, // Simplified reading time calculation
    minutes: Math.ceil(text.length / 200),
    time: text.length * 100, // Time in ms
    words: text.split(/\s+/).filter(Boolean).length
  }));
});

jest.mock('mdast-util-to-string', () => {
  const toString = jest.fn((tree) => {
    // Simulate extracting text from an mdast tree
    if (!tree || !tree.children) return '';
    
    const extractText = (node) => {
      if (node.type === 'text') {
        return node.value || '';
      }
      if (node.children) {
        return node.children.map(extractText).join(' ');
      }
      return '';
    };
    
    return extractText(tree) || '';
  });
  
  return { toString };
});

import { remarkReadingTime } from './remark-reading-time';

describe('remarkReadingTime', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should calculate reading time for a simple text', () => {
    // Mock the dependencies for this specific test
    const mockToString = require('mdast-util-to-string').toString;
    const mockGetReadingTime = require('reading-time');
    
    // Setup return values for mocks
    mockToString.mockReturnValue('Hello world.');
    mockGetReadingTime.mockReturnValue({
      text: '1 min read',
      minutes: 1,
      time: 200,
      words: 2
    });
    
    // Mock the data object that remark passes to the plugin
    const mockTree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'Hello world.'
            }
          ]
        }
      ]
    };
    
    const mockData = {
      astro: {
        frontmatter: {}
      }
    };
    
    // Call the function directly since we're testing the inner function
    const readingTimePlugin = remarkReadingTime();
    readingTimePlugin(mockTree, { data: mockData });
    
    // Check that minutesRead was added to frontmatter
    expect(mockData.astro.frontmatter.minutesRead).toBeDefined();
    expect(mockData.astro.frontmatter.minutesRead).toBe('1 min read');
    expect(mockToString).toHaveBeenCalledWith(mockTree);
    expect(mockGetReadingTime).toHaveBeenCalledWith('Hello world.');
  });

  it('should calculate reading time for longer text', () => {
    const mockToString = require('mdast-util-to-string').toString;
    const mockGetReadingTime = require('reading-time');
    
    const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. '.repeat(10); // Repeat to make it longer
    
    mockToString.mockReturnValue(longText);
    mockGetReadingTime.mockReturnValue({
      text: '5 min read',
      minutes: 5,
      time: longText.length * 100,
      words: longText.split(/\s+/).filter(Boolean).length
    });
    
    const mockTree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: longText
            }
          ]
        }
      ]
    };
    
    const mockData = {
      astro: {
        frontmatter: {}
      }
    };
    
    const readingTimePlugin = remarkReadingTime();
    readingTimePlugin(mockTree, { data: mockData });
    
    expect(mockData.astro.frontmatter.minutesRead).toBeDefined();
    expect(mockData.astro.frontmatter.minutesRead).toBe('5 min read');
  });

  it('should handle empty text', () => {
    const mockToString = require('mdast-util-to-string').toString;
    const mockGetReadingTime = require('reading-time');
    
    mockToString.mockReturnValue('');
    mockGetReadingTime.mockReturnValue({
      text: '0 min read',
      minutes: 0,
      time: 0,
      words: 0
    });
    
    const mockTree = {
      type: 'root',
      children: []
    };

    const mockData = {
      astro: {
        frontmatter: {}
      }
    };

    const readingTimePlugin = remarkReadingTime();
    readingTimePlugin(mockTree, { data: mockData });

    expect(mockData.astro.frontmatter.minutesRead).toBe('0 min read');
  });

  it('should handle text with markdown elements', () => {
    const mockToString = require('mdast-util-to-string').toString;
    const mockGetReadingTime = require('reading-time');
    
    mockToString.mockReturnValue('This is a paragraph with bold text and italic text');
    mockGetReadingTime.mockReturnValue({
      text: '1 min read',
      minutes: 1,
      time: 200,
      words: 10
    });

    const mockTree = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Title'
            }
          ]
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'This is a paragraph with '
            },
            {
              type: 'strong',
              children: [
                {
                  type: 'text',
                  value: 'bold text'
                }
              ]
            },
            {
              type: 'text',
              value: ' and '
            },
            {
              type: 'emphasis',
              children: [
                {
                  type: 'text',
                  value: 'italic text'
                }
              ]
            }
          ]
        }
      ]
    };
    
    const mockData = {
      astro: {
        frontmatter: {}
      }
    };
    
    const readingTimePlugin = remarkReadingTime();
    readingTimePlugin(mockTree, { data: mockData });
    
    expect(mockData.astro.frontmatter.minutesRead).toBe('1 min read');
  });

  it('should calculate different reading times for different content lengths', () => {
    const mockToString = require('mdast-util-to-string').toString;
    const mockGetReadingTime = require('reading-time');
    
    // Setup mock to return different results based on the input text length
    mockGetReadingTime.mockImplementation((text) => {
      const words = text.split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(words / 200)); // Simplified calculation
      return {
        text: `${minutes} min read`,
        minutes: minutes,
        time: text.length * 100,
        words: words
      };
    });

    const shortText = 'Short text.';
    const longText = 'This is a much longer text with many more words that should take longer to read than the short text provided above. It contains several sentences that increase the overall reading time calculation. Much longer text with many more words. This will definitely take more time to read than the short text. ';

    // Test short text
    mockToString.mockReturnValueOnce(shortText).mockReturnValueOnce(longText);
    
    const shortTree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: shortText
            }
          ]
        }
      ]
    };

    const shortData = {
      astro: {
        frontmatter: {}
      }
    };

    const longTree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: longText
            }
          ]
        }
      ]
    };

    const longData = {
      astro: {
        frontmatter: {}
      }
    };

    const readingTimePlugin = remarkReadingTime();
    readingTimePlugin(shortTree, { data: shortData });
    readingTimePlugin(longTree, { data: longData });

    // The long text should have equal or greater reading time than the short text
    const shortMinutes = parseInt(shortData.astro.frontmatter.minutesRead.split(' ')[0]);
    const longMinutes = parseInt(longData.astro.frontmatter.minutesRead.split(' ')[0]);
    
    expect(longMinutes).toBeGreaterThanOrEqual(shortMinutes);
  });
});