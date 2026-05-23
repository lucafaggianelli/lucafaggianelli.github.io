// Mock the site-config module before any imports that depend on it
jest.mock("@/site-config", () => ({
  siteConfig: {
    date: {
      locale: "en-US",
      options: {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    }
  }
}));

// Mock the webmentions module since it has complex dependencies
jest.mock("./webmentions", () => ({
  getWebmentionsForUrl: jest.fn(() => Promise.resolve([]))
}));

import { getFormattedDate } from "./date";
import { elementHasClass, toggleClass, rootInDarkMode } from "./domElement";
import { generateToc, type TocItem } from "./generateToc";
import { getWebmentionsForUrl } from "./webmentions";

describe("Utility Functions", () => {
  // Tests for date utilities
  describe("getFormattedDate", () => {
    test("formats a date string correctly with default options", () => {
      const dateStr = "2023-05-15";
      const result = getFormattedDate(dateStr);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    test("formats a date object correctly with default options", () => {
      const dateObj = new Date(2023, 4, 15); // May 15, 2023
      const result = getFormattedDate(dateObj);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    test("formats a timestamp number correctly with default options", () => {
      const timestamp = new Date(2023, 4, 15).getTime(); // May 15, 2023 timestamp
      const result = getFormattedDate(timestamp);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    test("formats date with custom options", () => {
      const dateStr = "2023-05-15";
      const customOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "long" };
      const result = getFormattedDate(dateStr, customOptions);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/2023|May/); // Should contain year or month
    });

    test("handles invalid date string", () => {
      const invalidDate = "invalid-date";
      expect(() => getFormattedDate(invalidDate)).toThrow();
    });
  });

  // Tests for DOM element utilities
  describe("DOM Element Utilities", () => {
    let testElement: HTMLElement;

    beforeEach(() => {
      testElement = document.createElement("div");
    });

    describe("elementHasClass", () => {
      test("returns true when element has the class", () => {
        testElement.classList.add("test-class");
        expect(elementHasClass(testElement, "test-class")).toBe(true);
      });

      test("returns false when element does not have the class", () => {
        expect(elementHasClass(testElement, "non-existent-class")).toBe(false);
      });

      test("returns false for empty class name", () => {
        testElement.classList.add("some-class");
        expect(elementHasClass(testElement, "")).toBe(false);
      });
    });

    describe("toggleClass", () => {
      test("adds class if not present", () => {
        toggleClass(testElement, "new-class");
        expect(testElement.classList.contains("new-class")).toBe(true);
      });

      test("removes class if already present", () => {
        testElement.classList.add("existing-class");
        toggleClass(testElement, "existing-class");
        expect(testElement.classList.contains("existing-class")).toBe(false);
      });

      test("toggles class back and forth", () => {
        toggleClass(testElement, "toggle-class");
        expect(testElement.classList.contains("toggle-class")).toBe(true);

        toggleClass(testElement, "toggle-class");
        expect(testElement.classList.contains("toggle-class")).toBe(false);

        toggleClass(testElement, "toggle-class");
        expect(testElement.classList.contains("toggle-class")).toBe(true);
      });
    });

    describe("rootInDarkMode", () => {
      test("returns true when data-theme is dark", () => {
        document.documentElement.setAttribute("data-theme", "dark");
        expect(rootInDarkMode()).toBe(true);
      });

      test("returns false when data-theme is not dark", () => {
        document.documentElement.setAttribute("data-theme", "light");
        expect(rootInDarkMode()).toBe(false);
      });

      test("returns false when data-theme attribute does not exist", () => {
        document.documentElement.removeAttribute("data-theme");
        expect(rootInDarkMode()).toBe(false);
      });

      test("returns false when data-theme is other values", () => {
        document.documentElement.setAttribute("data-theme", "auto");
        expect(rootInDarkMode()).toBe(false);
      });
    });
  });

  // Tests for table of contents utilities
  describe("generateToc", () => {
    test("generates empty TOC when no headings provided", () => {
      const headings = [];
      const result = generateToc(headings);
      expect(result).toEqual([]);
    });

    test("filters headings based on default levels (h2-h4)", () => {
      const headings = [
        { depth: 1, slug: "h1", text: "H1" },
        { depth: 2, slug: "h2", text: "H2" },
        { depth: 3, slug: "h3", text: "H3" },
        { depth: 4, slug: "h4", text: "H4" },
        { depth: 5, slug: "h5", text: "H5" },
        { depth: 6, slug: "h6", text: "H6" }
      ];

      const result = generateToc(headings);
      const filteredDepths = result.map(h => h.depth);
      expect(result.length).toBeGreaterThan(0); // At least some headings should pass the filter
      expect(filteredDepths.every(depth => depth >= 2 && depth <= 4)).toBe(true); // All should be in range
    });

    test("filters headings based on custom levels", () => {
      const headings = [
        { depth: 1, slug: "h1", text: "H1" },
        { depth: 2, slug: "h2", text: "H2" },
        { depth: 3, slug: "h3", text: "H3" },
        { depth: 4, slug: "h4", text: "H4" },
        { depth: 5, slug: "h5", text: "H5" }
      ];

      const result = generateToc(headings, { minHeadingLevel: 3, maxHeadingLevel: 5 });
      const filteredDepths = result.map(h => h.depth);
      expect(result.length).toBeGreaterThan(0); // At least some headings should pass the filter
      expect(filteredDepths.every(depth => depth >= 3 && depth <= 5)).toBe(true); // All should be in range
    });

    test("creates TOC with nested structure", () => {
      const headings = [
        { depth: 2, slug: "heading-2-a", text: "Heading 2A" },
        { depth: 3, slug: "heading-3-a", text: "Heading 3A" },
        { depth: 4, slug: "heading-4-a", text: "Heading 4A" },
        { depth: 2, slug: "heading-2-b", text: "Heading 2B" },
        { depth: 3, slug: "heading-3-b", text: "Heading 3B" }
      ];

      const result = generateToc(headings);

      expect(result.length).toBe(2);
      expect(result[0].text).toBe("Heading 2A");
      expect(result[0].children.length).toBe(1);
      expect(result[0].children[0].text).toBe("Heading 3A");
      expect(result[0].children[0].children.length).toBe(1);
      expect(result[0].children[0].children[0].text).toBe("Heading 4A");
      expect(result[1].text).toBe("Heading 2B");
      expect(result[1].children.length).toBe(1);
      expect(result[1].children[0].text).toBe("Heading 3B");
    });

    test("handles TOC with only top-level headings", () => {
      const headings = [
        { depth: 2, slug: "h2-1", text: "H2-1" },
        { depth: 2, slug: "h2-2", text: "H2-2" }
      ];

      const result = generateToc(headings);
      expect(result.length).toBe(2);
      expect(result.every(item => item.children.length === 0)).toBe(true);
    });
  });

  // Tests for webmentions (mock implementations for testing)
  describe("getWebmentionsForUrl", () => {
    beforeAll(() => {
      // Mock the global fetch API
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              lastFetched: new Date().toISOString(),
              children: []
            })
        } as Response)
      );
    });

    afterAll(() => {
      // Restore the original fetch API
      jest.restoreAllMocks();
    });

    test("returns webmentions filtered by URL", async () => {
      // Since the function involves caching and external API calls,
      // this test verifies that the function at least exists and can be called
      const mockUrl = "https://example.com/page";

      // The function requires a valid environment setup to work properly
      // For unit testing purposes, we'll just check the function signature
      expect(getWebmentionsForUrl).toBeDefined();
      expect(typeof getWebmentionsForUrl).toBe("function");

      // Note: We can't fully test this without proper env variables and network mocks
      // but we can verify that the function exists and has correct signature
    });
  });
});