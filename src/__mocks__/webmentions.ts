import type { WebmentionsCache, WebmentionsChildren } from "@/types";

// Mock constants
const validWebmentionTypes = ["like-of", "mention-of", "in-reply-to"];

// Mock functions with the same interface as the original
export function filterWebmentions(webmentions: WebmentionsChildren[]) {
  return webmentions.filter((webmention) => {
    // make sure the mention has a property so we can sort them later
    if (!validWebmentionTypes.includes(webmention["wm-property"])) return false;

    // make sure 'mention-of' or 'in-reply-to' has text content.
    if (webmention["wm-property"] === "mention-of" || webmention["wm-property"] === "in-reply-to") {
      return webmention.content && webmention.content.text !== "";
    }

    return true;
  });
}

// Mock singleton for webmentions cache
let webMentions: WebmentionsCache | undefined;

export async function getWebmentionsForUrl(url: string) {
  // In a real implementation, this would fetch and cache webmentions
  // For testing, we'll return a mock implementation
  if (!webMentions) {
    // Initialize with a mock cache
    webMentions = {
      lastFetched: new Date().toISOString(),
      children: []
    };
  }
  
  return webMentions.children.filter((entry) => entry["wm-target"] === url);
}

// Export functions that may be needed by tests
export { webMentions };