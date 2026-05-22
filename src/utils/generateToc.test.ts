import { generateToc, TocItem } from './generateToc';
import type { MarkdownHeading } from 'astro';

describe('generateToc', () => {
  const sampleHeadings: MarkdownHeading[] = [
    { depth: 1, slug: 'introduction', text: 'Introduction' },
    { depth: 2, slug: 'getting-started', text: 'Getting Started' },
    { depth: 3, slug: 'installation', text: 'Installation' },
    { depth: 4, slug: 'basic-usage', text: 'Basic Usage' },
    { depth: 5, slug: 'advanced-features', text: 'Advanced Features' },
    { depth: 6, slug: 'troubleshooting', text: 'Troubleshooting' },
    { depth: 2, slug: 'configuration', text: 'Configuration' },
    { depth: 3, slug: 'options', text: 'Options' },
    { depth: 2, slug: 'examples', text: 'Examples' },
  ];

  test('should generate a table of contents with default levels', () => {
    const result = generateToc(sampleHeadings);

    // Default min level is 2 and max level is 4, so we get h2, h3, h4 headings
    // The sequence after filtering is: h2(Getting Started), h3(Installation), h4(Basic Usage), h2(Configuration), h3(Options), h2(Examples)
    expect(result).toHaveLength(3); // 3 h2 headings at root level

    const [firstItem, secondItem, thirdItem] = result;

    expect(firstItem.text).toBe('Getting Started');
    expect(firstItem.depth).toBe(2);
    expect(firstItem.slug).toBe('getting-started');

    // Installation (h3) should be a child of Getting Started (h2)
    expect(firstItem.children).toHaveLength(1);
    expect(firstItem.children[0].text).toBe('Installation');
    expect(firstItem.children[0].depth).toBe(3);

    // Basic Usage (h4) should be a child of Installation (h3)
    expect(firstItem.children[0].children).toHaveLength(1);
    expect(firstItem.children[0].children[0].text).toBe('Basic Usage');
    expect(firstItem.children[0].children[0].depth).toBe(4);

    // Configuration (h2) should be at root level
    expect(secondItem.text).toBe('Configuration');
    expect(secondItem.depth).toBe(2);

    // Options (h3) should be a child of Configuration (h2)
    expect(secondItem.children).toHaveLength(1);
    expect(secondItem.children[0].text).toBe('Options');
    expect(secondItem.children[0].depth).toBe(3);

    // Examples (h2) should be at root level
    expect(thirdItem.text).toBe('Examples');
    expect(thirdItem.depth).toBe(2);
  });

  test('should respect custom minHeadingLevel', () => {
    const result = generateToc(sampleHeadings, { minHeadingLevel: 3 });
    
    // Should only include headings from depth 3 to 4 (default max)
    expect(result).toHaveLength(2); // 'Installation' and 'Options' are the top-level items
    
    expect(result[0].text).toBe('Installation');
    expect(result[0].depth).toBe(3);
    expect(result[1].text).toBe('Options');
    expect(result[1].depth).toBe(3);
    
    // Check that Basic Usage is a child of Installation
    expect(result[0].children[0].text).toBe('Basic Usage');
    expect(result[0].children[0].depth).toBe(4);
  });

  test('should respect custom maxHeadingLevel', () => {
    const result = generateToc(sampleHeadings, { maxHeadingLevel: 5 });

    // Should include headings from depth 2 to 5
    expect(result).toHaveLength(3); // h2 headings: 'Getting Started', 'Configuration', 'Examples'

    // 'Getting Started' should have 'Installation' as child, 'Installation' should have 'Basic Usage' as child, and 'Basic Usage' should have 'Advanced Features' as child
    const gettingStarted = result.find(item => item.text === 'Getting Started');
    expect(gettingStarted?.children).toHaveLength(1);
    expect(gettingStarted?.children[0].text).toBe('Installation');
    expect(gettingStarted?.children[0].children).toHaveLength(1);
    expect(gettingStarted?.children[0].children[0].text).toBe('Basic Usage');
    expect(gettingStarted?.children[0].children[0].children).toHaveLength(1);
    expect(gettingStarted?.children[0].children[0].children[0].text).toBe('Advanced Features');
  });

  test('should handle empty headings array', () => {
    const result = generateToc([]);
    expect(result).toEqual([]);
  });

  test('should filter out headings outside the depth range', () => {
    const headings: MarkdownHeading[] = [
      { depth: 1, slug: 'title', text: 'Title' },
      { depth: 6, slug: 'footer', text: 'Footer' },
    ];
    
    const result = generateToc(headings);
    
    // Both h1 and h6 should be filtered out with default settings
    expect(result).toEqual([]);
  });

  test('should create nested structure correctly', () => {
    const headings: MarkdownHeading[] = [
      { depth: 2, slug: 'level2-a', text: 'Level 2 A' },
      { depth: 3, slug: 'level3-a', text: 'Level 3 A' },
      { depth: 4, slug: 'level4-a', text: 'Level 4 A' },
      { depth: 3, slug: 'level3-b', text: 'Level 3 B' },
      { depth: 2, slug: 'level2-b', text: 'Level 2 B' },
      { depth: 3, slug: 'level3-c', text: 'Level 3 C' },
    ];
    
    const result: TocItem[] = generateToc(headings);
    
    expect(result).toHaveLength(2);
    
    // First root item
    expect(result[0].text).toBe('Level 2 A');
    expect(result[0].children).toHaveLength(2);
    expect(result[0].children[0].text).toBe('Level 3 A');
    expect(result[0].children[0].children[0].text).toBe('Level 4 A');
    expect(result[0].children[1].text).toBe('Level 3 B');
    
    // Second root item
    expect(result[1].text).toBe('Level 2 B');
    expect(result[1].children).toHaveLength(1);
    expect(result[1].children[0].text).toBe('Level 3 C');
  });

  test('should work with only one heading level', () => {
    const headings: MarkdownHeading[] = [
      { depth: 2, slug: 'item1', text: 'Item 1' },
      { depth: 2, slug: 'item2', text: 'Item 2' },
      { depth: 2, slug: 'item3', text: 'Item 3' },
    ];
    
    const result = generateToc(headings, { minHeadingLevel: 2, maxHeadingLevel: 2 });
    
    expect(result).toHaveLength(3);
    expect(result.every(item => item.depth === 2)).toBe(true);
    expect(result.every(item => item.children.length === 0)).toBe(true);
  });

  test('should handle edge case where min level is higher than max level', () => {
    const headings: MarkdownHeading[] = [
      { depth: 2, slug: 'item1', text: 'Item 1' },
      { depth: 3, slug: 'item2', text: 'Item 2' },
    ];
    
    const result = generateToc(headings, { minHeadingLevel: 4, maxHeadingLevel: 2 }); // Invalid range
    
    // When min > max, no headings should match the filter condition
    expect(result).toEqual([]);
  });

  test('should preserve all heading properties', () => {
    const headings: MarkdownHeading[] = [
      { depth: 2, slug: 'test-heading', text: 'Test Heading' },
    ];
    
    const result = generateToc(headings);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('depth', 2);
    expect(result[0]).toHaveProperty('slug', 'test-heading');
    expect(result[0]).toHaveProperty('text', 'Test Heading');
    expect(result[0]).toHaveProperty('children', []);
  });
});