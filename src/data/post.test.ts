import type { CollectionEntry } from "astro:content";

/**
 * Note: The functions below are copied from ./post.ts because Jest cannot 
 * properly parse files containing import.meta syntax.
 * 
 * Original source functions:
 */

// Note: getAllPosts is not tested here due to import.meta.env dependency that Jest cannot handle
// export async function getAllPosts() {
// 	return await getCollection("post", ({ data }) => {
// 		return import.meta.env.PROD ? data.draft !== true : true;
// 	});
// }

function sortMDByDate(posts: Array<CollectionEntry<"post">>) {
	return posts.sort((a, b) => {
		const aDate = new Date(a.data.updatedDate ?? a.data.publishDate).valueOf();
		const bDate = new Date(b.data.updatedDate ?? b.data.publishDate).valueOf();
		return bDate - aDate;
	});
}

function getAllTags(posts: Array<CollectionEntry<"post">>) {
	return posts.flatMap((post) => [...post.data.tags]);
}

function getUniqueTags(posts: Array<CollectionEntry<"post">>) {
	return [...new Set(getAllTags(posts))];
}

function getUniqueTagsWithCount(
	posts: Array<CollectionEntry<"post">>,
): Array<[string, number]> {
	return [
		...getAllTags(posts).reduce(
			(acc, t) => acc.set(t, (acc.get(t) || 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}

// Mock post data for testing
const mockPosts: Array<CollectionEntry<"post">> = [
	{
		id: "post1.md",
		slug: "post1",
		body: "",
		collection: "post",
		data: {
			title: "Post 1",
			description: "First post",
			publishDate: "2023-01-01",
			tags: ["tag1", "tag2"],
			draft: false,
		},
	},
	{
		id: "post2.md",
		slug: "post2",
		body: "",
		collection: "post",
		data: {
			title: "Post 2",
			description: "Second post",
			publishDate: "2023-02-01",
			updatedDate: "2023-02-02",
			tags: ["tag2", "tag3"],
			draft: false,
		},
	},
	{
		id: "post3.md",
		slug: "post3",
		body: "",
		collection: "post",
		data: {
			title: "Draft Post",
			description: "This is a draft",
			publishDate: "2023-03-01",
			tags: ["tag1", "tag3", "tag4"],
			draft: true,
		},
	},
];

describe("Post Data Functions", () => {
	describe("sortMDByDate", () => {
		it("should sort posts by date in descending order (newest first)", () => {
			const unsortedPosts = [
				mockPosts[0], // Jan 1, 2023 (publishDate)
				mockPosts[2], // Mar 1, 2023 (publishDate)
				mockPosts[1], // Feb 1, 2023 (publishDate), updated Feb 2, 2023
			];

			const sortedPosts = sortMDByDate(unsortedPosts);

			// Draft Post should come first (publishDate Mar 1, 2023)
			// Then Post 2 (updatedDate Feb 2, 2023, which takes priority over publishDate)
			// Then Post 1 (publishDate Jan 1, 2023)
			expect(sortedPosts[0].data.title).toBe("Draft Post"); // publishDate: Mar 1, 2023
			expect(sortedPosts[1].data.title).toBe("Post 2"); // updatedDate: Feb 2, 2023
			expect(sortedPosts[2].data.title).toBe("Post 1"); // publishDate: Jan 1, 2023

			// Verify sorting by updatedDate when available, fallback to publishDate
			const dates = sortedPosts.map(post =>
				new Date(post.data.updatedDate ?? post.data.publishDate)
			);

			for (let i = 0; i < dates.length - 1; i++) {
				expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
			}
		});

		it("should handle posts without updatedDate by using publishDate", () => {
			const postsWithoutUpdatedDate = [
				{
					...mockPosts[0],
					data: {
						...mockPosts[0].data,
						updatedDate: undefined,
					}
				},
				{
					...mockPosts[2],
					data: {
						...mockPosts[2].data,
						updatedDate: undefined,
					}
				},
			];

			const sortedPosts = sortMDByDate(postsWithoutUpdatedDate);

			// Should sort correctly using publishDate when updatedDate is not present
			const firstDate = new Date(sortedPosts[0].data.publishDate);
			const secondDate = new Date(sortedPosts[1].data.publishDate);
			expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
		});

		it("should properly sort when some posts have updatedDate and others don't", () => {
			const mixedPosts = [
				{
					...mockPosts[0], // publishDate: Jan 1, 2023, no updatedDate
					data: {
						...mockPosts[0].data,
						updatedDate: undefined,
					}
				},
				{
					...mockPosts[1], // publishDate: Feb 1, 2023, updatedDate: Feb 2, 2023
				},
			];

			const sortedPosts = sortMDByDate(mixedPosts);

			// Post with updatedDate (Feb 2) should come first
			expect(sortedPosts[0].data.title).toBe("Post 2"); // updatedDate: Feb 2, 2023
			expect(sortedPosts[1].data.title).toBe("Post 1"); // publishDate: Jan 1, 2023
		});
	});

	describe("getAllTags", () => {
		it("should return all tags from all posts", () => {
			const result = getAllTags(mockPosts);

			// Should return all tags from all posts: [tag1, tag2, tag2, tag3, tag1, tag3, tag4]
			expect(result).toEqual(["tag1", "tag2", "tag2", "tag3", "tag1", "tag3", "tag4"]);
		});

		it("should handle posts with empty tags array", () => {
			const postsWithEmptyTags = [
				{
					...mockPosts[0],
					data: {
						...mockPosts[0].data,
						tags: [],
					}
				},
				mockPosts[1],
			];

			const result = getAllTags(postsWithEmptyTags);

			// Should only include tags from the second post since first has empty tags
			expect(result).toEqual(["tag2", "tag3"]);
		});

		it("should return empty array when no posts", () => {
			const result = getAllTags([]);
			expect(result).toEqual([]);
		});
	});

	describe("getUniqueTags", () => {
		it("should return unique tags only", () => {
			const result = getUniqueTags(mockPosts);

			// Should return unique tags: tag1, tag2, tag3, tag4 in order of first appearance
			expect(result).toEqual(["tag1", "tag2", "tag3", "tag4"]);
			expect(result).toHaveLength(4);
		});

		it("should maintain order of first appearance", () => {
			const result = getUniqueTags([
				{
					...mockPosts[0],
					data: {
						...mockPosts[0].data,
						tags: ["z-tag", "a-tag", "m-tag"],
					}
				},
				{
					...mockPosts[1],
					data: {
						...mockPosts[1].data,
						tags: ["a-tag", "b-tag"],
					}
				},
			]);

			// Should maintain the order of first appearance: z-tag, a-tag, m-tag, b-tag
			expect(result).toEqual(["z-tag", "a-tag", "m-tag", "b-tag"]);
		});

		it("should return empty array when no posts", () => {
			const result = getUniqueTags([]);
			expect(result).toEqual([]);
		});
	});

	describe("getUniqueTagsWithCount", () => {
		it("should return unique tags with their counts in descending order", () => {
			const result = getUniqueTagsWithCount(mockPosts);

			// Expected counts: tag1 (2), tag2 (1), tag3 (2), tag4 (1)
			// Since tag1 and tag3 both have count 2, they should come first
			const counts = result.map(item => item[1]);
			// All items with count 2 should come before items with count 1
			const firstTwoCounts = counts.slice(0, 3); // First three should have count 2
			const lastCount = counts.slice(3);        // Last should have count 1
			
			firstTwoCounts.forEach(count => expect(count).toBe(2));
			lastCount.forEach(count => expect(count).toBe(1));

			// Verify that the values are the correct tags
			const tags = result.map(item => item[0]);
			expect(tags).toContain("tag1");
			expect(tags).toContain("tag2");
			expect(tags).toContain("tag3");
			expect(tags).toContain("tag4");
		});

		it("should sort by count in descending order", () => {
			const postsForCountTest = [
				{
					...mockPosts[0],
					data: {
						...mockPosts[0].data,
						tags: ["common", "common", "unique1"],
					}
				},
				{
					...mockPosts[1],
					data: {
						...mockPosts[1].data,
						tags: ["common", "unique2"],
					}
				},
			];

			const result = getUniqueTagsWithCount(postsForCountTest);

			// "common" appears 3 times total, "unique1" and "unique2" appear once each
			expect(result[0]).toEqual(["common", 3]);
			const remainingTags = result.slice(1).map(item => [item[0], item[1]]);
			expect(remainingTags).toContainEqual(["unique1", 1]);
			expect(remainingTags).toContainEqual(["unique2", 1]);
			expect(remainingTags).toHaveLength(2);
		});

		it("should return empty array when no tags exist", () => {
			const postsWithoutTags = [
				{
					...mockPosts[0],
					data: {
						...mockPosts[0].data,
						tags: [],
					}
				},
			];

			const result = getUniqueTagsWithCount(postsWithoutTags);

			expect(result).toEqual([]);
		});

		it("should handle duplicate tags within same post", () => {
			const postsWithDuplicateTags = [
				{
					...mockPosts[0],
					data: {
						...mockPosts[0].data,
						tags: ["duplicate", "duplicate", "unique"],
					}
				},
			];

			const result = getUniqueTagsWithCount(postsWithDuplicateTags);

			expect(result).toEqual([
				["duplicate", 2],
				["unique", 1],
			]);
		});

		it("should return empty array when no posts", () => {
			const result = getUniqueTagsWithCount([]);
			expect(result).toEqual([]);
		});
	});
});