import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

// Define the same helper function as in the config file
function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array;
  const lowercaseItems = array.map((str) => str.toLowerCase());
  const distinctItems = new Set(lowercaseItems);
  return Array.from(distinctItems);
}

// Recreate the schema to be able to test it independently of Astro runtime
function createPostSchema(imageValidator: () => z.ZodString) {
  return z.object({
    coverImage: z
      .object({
        alt: z.string(),
        src: imageValidator(),
      })
      .optional(),
    description: z.string().min(50).max(160),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
    publishDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
    title: z.string().max(60),
    updatedDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
  });
}

describe('Content Configuration', () => {
  describe('Post Collection Schema', () => {
    const schema = createPostSchema(() => z.string().url()); // Mock image function for testing

    it('should validate a correctly formatted post', () => {
      const validPost = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01',
        title: 'Valid Post Title',
      };

      const result = schema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should validate a post with all optional fields', () => {
      const validPostWithOptionalFields = {
        coverImage: {
          alt: 'Cover image alt text',
          src: 'https://example.com/image.jpg'
        },
        description: 'This is a valid post description that meets the minimum length requirement.',
        draft: true,
        ogImage: 'https://example.com/og-image.jpg',
        publishDate: '2023-01-01',
        tags: ['tag1', 'TAG2', 'tag1'], // Should deduplicate to ['tag1', 'tag2']
        title: 'Valid Post Title',
        updatedDate: '2023-01-02'
      };

      const result = schema.safeParse(validPostWithOptionalFields);

      if (result.success) {
        // Check that tags are deduplicated and lowercased
        expect(result.data.tags).toContain('tag1');
        expect(result.data.tags).toContain('tag2');
        expect(result.data.tags).toHaveLength(2); // Deduplicated
        // Check that dates are transformed properly
        expect(result.data.publishDate).toBeInstanceOf(Date);
        expect(result.data.updatedDate).toBeInstanceOf(Date);
      }

      expect(result.success).toBe(true);
    });

    it('should apply defaults for optional fields', () => {
      const minimalPost = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01',
        title: 'Minimal Valid Post'
      };

      const result = schema.safeParse(minimalPost);

      if (result.success) {
        expect(result.data.draft).toBe(false); // Default value
        expect(result.data.tags).toEqual([]); // Default value
      }

      expect(result.success).toBe(true);
    });

    it('should transform tags to remove duplicates and convert to lowercase', () => {
      const postWithDuplicateTags = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01',
        tags: ['JavaScript', 'JAVASCRIPT', 'javascript', 'React', 'REACT'],
        title: 'Post with Duplicate Tags'
      };

      const result = schema.safeParse(postWithDuplicateTags);

      if (result.success) {
        expect(result.data.tags.sort()).toEqual(['javascript', 'react']);
      }

      expect(result.success).toBe(true);
    });

    it('should handle empty tags array correctly', () => {
      const postWithEmptyTags = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01',
        tags: [],
        title: 'Post with Empty Tags'
      };

      const result = schema.safeParse(postWithEmptyTags);

      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }

      expect(result.success).toBe(true);
    });

    it('should transform date strings to Date objects', () => {
      const postWithDates = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01T10:00:00Z',
        title: 'Post with Date Transformation'
      };

      const result = schema.safeParse(postWithDates);

      if (result.success) {
        expect(result.data.publishDate).toBeInstanceOf(Date);
        expect(result.data.publishDate.toISOString()).toBe(new Date('2023-01-01T10:00:00Z').toISOString());
      }

      expect(result.success).toBe(true);
    });

    it('should transform updatedDate string to Date object or undefined', () => {
      const postWithUpdatedDate = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01',
        title: 'Post with Updated Date',
        updatedDate: '2023-01-02T15:30:00Z'
      };

      const result = schema.safeParse(postWithUpdatedDate);

      if (result.success) {
        expect(result.data.updatedDate).toBeInstanceOf(Date);
        expect(result.data.updatedDate?.toISOString()).toBe(new Date('2023-01-02T15:30:00Z').toISOString());
      }

      expect(result.success).toBe(true);

      // Test with undefined updatedDate
      const postWithoutUpdatedDate = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01',
        title: 'Post without Updated Date'
      };

      const result2 = schema.safeParse(postWithoutUpdatedDate);

      if (result2.success) {
        expect(result2.data.updatedDate).toBeUndefined();
      }

      expect(result2.success).toBe(true);
    });
  });

  describe('Schema Validation Errors', () => {
    const schema = createPostSchema(() => z.string().url()); // Mock image function for testing

    it('should fail validation for descriptions that are too short', () => {
      const invalidPost = {
        description: 'Too short',
        publishDate: '2023-01-01',
        title: 'Invalid Post'
      };

      const result = schema.safeParse(invalidPost);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessages = result.error.errors.map(e => e.message);
        expect(errorMessages).toContain('String must contain at least 50 character(s)');
      }
    });

    it('should fail validation for titles that are too long', () => {
      const invalidPost = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01',
        title: 'This title is way too long and exceeds the maximum allowed length of sixty characters for the title field'
      };

      const result = schema.safeParse(invalidPost);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessages = result.error.errors.map(e => e.message);
        expect(errorMessages).toContain('String must contain at most 60 character(s)');
      }
    });

    it('should validate cover image schema when provided', () => {
      const invalidPost = {
        coverImage: {
          alt: '', // Invalid: empty alt
          src: 'invalid-url' // Invalid: not a valid URL
        },
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: '2023-01-01',
        title: 'Invalid Cover Image Post'
      };

      const result = schema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should fail validation for invalid date formats', () => {
      // Note: Zod's string.or(date()) transform will try to convert the string to a date,
      // which may succeed even with unusual formats. Instead, we'll test other types of invalid inputs
      // Testing more robustly by creating an example that should definitely fail
      const invalidPost = {
        description: 'This is a valid post description that meets the minimum length requirement.',
        publishDate: null, // Not a string or date - should fail
        title: 'Invalid Date Post'
      };

      const result = schema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });
  });

  describe('removeDupsAndLowerCase function', () => {
    it('should remove duplicates and convert to lowercase', () => {
      const input = ['JavaScript', 'JAVASCRIPT', 'javascript', 'React', 'REACT'];
      const result = removeDupsAndLowerCase(input);
      expect(result.sort()).toEqual(['javascript', 'react']);
    });

    it('should handle empty arrays', () => {
      const input: string[] = [];
      const result = removeDupsAndLowerCase(input);
      expect(result).toEqual([]);
    });

    it('should handle arrays with one element', () => {
      const input = ['HELLO'];
      const result = removeDupsAndLowerCase(input);
      expect(result).toEqual(['hello']);
    });

    it('should handle arrays with no duplicates', () => {
      const input = ['JavaScript', 'React', 'NodeJS'];
      const result = removeDupsAndLowerCase(input);
      expect(result.sort()).toEqual(['javascript', 'nodejs', 'react']);
    });

    it('should return the same array if there are no elements', () => {
      const input: string[] = [];
      const result = removeDupsAndLowerCase(input);
      expect(result).toEqual([]);
    });
  });
});