import { getFormattedDate } from "./date";

// Mock siteConfig to control the tests
jest.mock("@/site-config", () => ({
  siteConfig: {
    date: {
      locale: "en-US",
      options: {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    },
  },
}));

describe("getFormattedDate", () => {
  beforeEach(() => {
    // Reset any mocks between tests if needed
    jest.clearAllMocks();
  });

  it("should format date string correctly with default options", () => {
    const dateString = "2023-05-15";
    const expected = "May 15, 2023";
    
    const result = getFormattedDate(dateString);
    
    expect(result).toBe(expected);
  });

  it("should format date object correctly with default options", () => {
    const dateObj = new Date(2023, 4, 15); // Month is 0-indexed, so 4 is May
    const expected = "May 15, 2023";
    
    const result = getFormattedDate(dateObj);
    
    expect(result).toBe(expected);
  });

  it("should format timestamp number correctly with default options", () => {
    const timestamp = new Date(2023, 9, 31).getTime(); // October 31, 2023
    const expected = "October 31, 2023";
    
    const result = getFormattedDate(timestamp);
    
    expect(result).toBe(expected);
  });

  it("should handle options parameter and merge with default options", () => {
    const dateString = "2023-05-15";
    const options = { month: "short" }; // Override month to be short instead of long
    const expected = "May 15, 2023"; // In en-US, long and short for May is the same
    
    const result = getFormattedDate(dateString, options);
    
    expect(result).toBe(expected);
  });

  it("should handle custom options that differ significantly from defaults", () => {
    const dateString = "2023-05-15";
    const options = { weekday: "long", month: "numeric", day: "2-digit" };
    
    // With weekday, this would return something like "Monday, 5/15/2023" depending on the actual day
    const result = getFormattedDate(dateString, options);
    
    // Just verify it returns a string and doesn't throw
    expect(typeof result).toBe("string");
    expect(result).toContain("2023"); // Should still contain the year
  });

  it("should handle invalid date strings by throwing an error", () => {
    const invalidDate = "not-a-date";

    expect(() => getFormattedDate(invalidDate)).toThrow(RangeError);
  });

  it("should handle edge cases like Unix epoch", () => {
    const epochTime = 0;
    // This corresponds to January 1, 1970 UTC (might vary by timezone)
    const result = getFormattedDate(epochTime);
    
    expect(typeof result).toBe("string");
  });

  it("should handle date strings with different formats", () => {
    const isoString = "2023-12-25T10:30:00Z";
    const result = getFormattedDate(isoString);
    
    expect(typeof result).toBe("string");
  });
});