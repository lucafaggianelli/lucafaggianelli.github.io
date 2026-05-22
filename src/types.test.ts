import {
	SiteConfig,
	PaginationLink,
	SiteMeta,
	WebmentionsFeed,
	WebmentionsCache,
	WebmentionsChildren,
	Author,
	Content,
	Rels,
	Summary
} from './types';

describe('Types', () => {
	describe('SiteConfig', () => {
		it('should match the expected structure', () => {
			const mockSiteConfig: SiteConfig = {
				author: 'John Doe',
				title: 'Test Site',
				description: 'A test site',
				lang: 'en-US',
				ogLocale: 'en_US',
				date: {
					locale: 'en-US',
					options: {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					}
				},
				webmentions: {
					link: 'https://webmention.io/test/site',
					pingback: 'https://webmention.io/test/xmlrpc'
				}
			};

			expect(mockSiteConfig).toBeDefined();
			expect(mockSiteConfig.author).toBe('John Doe');
			expect(mockSiteConfig.title).toBe('Test Site');
			expect(mockSiteConfig.description).toBe('A test site');
			expect(mockSiteConfig.lang).toBe('en-US');
			expect(mockSiteConfig.ogLocale).toBe('en_US');
			
			// Check nested objects
			expect(mockSiteConfig.date.locale).toBe('en-US');
			expect(mockSiteConfig.date.options.year).toBe('numeric');
			expect(mockSiteConfig.webmentions?.link).toBe('https://webmention.io/test/site');
		});

		it('should allow optional webmentions property to be undefined', () => {
			const mockSiteConfigWithoutWebmentions: SiteConfig = {
				author: 'Jane Doe',
				title: 'Another Test Site',
				description: 'Another test site',
				lang: 'en-GB',
				ogLocale: 'en_GB',
				date: {
					locale: ['en-GB', 'en-US'],
					options: {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					}
				}
				// webmentions is optional and not provided
			};

			expect(mockSiteConfigWithoutWebmentions).toBeDefined();
			expect(mockSiteConfigWithoutWebmentions.webmentions).toBeUndefined();
		});
	});

	describe('PaginationLink', () => {
		it('should match the expected structure', () => {
			const mockPaginationLink: PaginationLink = {
				url: '/page/2',
				text: 'Next Page',
				srLabel: 'Go to next page'
			};

			expect(mockPaginationLink).toBeDefined();
			expect(mockPaginationLink.url).toBe('/page/2');
			expect(mockPaginationLink.text).toBe('Next Page');
			expect(mockPaginationLink.srLabel).toBe('Go to next page');
		});

		it('should allow optional properties to be undefined', () => {
			const mockPaginationLinkWithoutOptional: PaginationLink = {
				url: '/page/1'
				// text and srLabel are optional
			};

			expect(mockPaginationLinkWithoutOptional).toBeDefined();
			expect(mockPaginationLinkWithoutOptional.url).toBe('/page/1');
			expect(mockPaginationLinkWithoutOptional.text).toBeUndefined();
			expect(mockPaginationLinkWithoutOptional.srLabel).toBeUndefined();
		});
	});

	describe('SiteMeta', () => {
		it('should match the expected structure', () => {
			const mockSiteMeta: SiteMeta = {
				title: 'Article Title',
				description: 'Article description',
				ogImage: 'https://example.com/image.jpg',
				articleDate: '2023-09-20'
			};

			expect(mockSiteMeta).toBeDefined();
			expect(mockSiteMeta.title).toBe('Article Title');
			expect(mockSiteMeta.description).toBe('Article description');
			expect(mockSiteMeta.ogImage).toBe('https://example.com/image.jpg');
			expect(mockSiteMeta.articleDate).toBe('2023-09-20');
		});

		it('should allow optional properties to be undefined', () => {
			const mockSiteMetaWithRequiredOnly: SiteMeta = {
				title: 'Simple Title'
				// All other properties are optional
			};

			expect(mockSiteMetaWithRequiredOnly).toBeDefined();
			expect(mockSiteMetaWithRequiredOnly.title).toBe('Simple Title');
			expect(mockSiteMetaWithRequiredOnly.description).toBeUndefined();
			expect(mockSiteMetaWithRequiredOnly.ogImage).toBeUndefined();
			expect(mockSiteMetaWithRequiredOnly.articleDate).toBeUndefined();
		});
	});

	describe('Webmentions Types', () => {
		describe('WebmentionsFeed', () => {
			it('should match the expected structure', () => {
				const mockWebmentionsFeed: WebmentionsFeed = {
					type: 'feed',
					name: 'Test Feed',
					children: []
				};

				expect(mockWebmentionsFeed).toBeDefined();
				expect(mockWebmentionsFeed.type).toBe('feed');
				expect(mockWebmentionsFeed.name).toBe('Test Feed');
				expect(mockWebmentionsFeed.children).toEqual([]);
			});
		});

		describe('WebmentionsCache', () => {
			it('should match the expected structure', () => {
				const mockWebmentionsCache: WebmentionsCache = {
					lastFetched: '2023-09-20T10:00:00Z',
					children: []
				};

				expect(mockWebmentionsCache).toBeDefined();
				expect(mockWebmentionsCache.lastFetched).toBe('2023-09-20T10:00:00Z');
				expect(mockWebmentionsCache.children).toEqual([]);
			});

			it('should allow lastFetched to be null', () => {
				const mockWebmentionsCacheWithNull: WebmentionsCache = {
					lastFetched: null,
					children: []
				};

				expect(mockWebmentionsCacheWithNull).toBeDefined();
				expect(mockWebmentionsCacheWithNull.lastFetched).toBeNull();
			});
		});

		describe('WebmentionsChildren', () => {
			it('should match the expected structure', () => {
				const mockWebmentionsChildren: WebmentionsChildren = {
					type: 'entry',
					author: {
						type: 'card',
						name: 'John Doe',
						photo: 'https://example.com/photo.jpg',
						url: 'https://example.com'
					},
					url: 'https://example.com/post',
					published: '2023-09-20T10:00:00Z',
					'wm-received': '2023-09-20T10:05:00Z',
					'wm-id': 123,
					'wm-source': 'https://source.example.com',
					'wm-target': 'https://target.example.com',
					'wm-protocol': 'webmention',
					syndication: ['https://twitter.com/example/123'],
					content: {
						'content-type': 'text/html',
						value: 'Test content',
						html: '<p>Test content</p>',
						text: 'Test content'
					},
					'mention-of': 'https://mentioned.example.com',
					'wm-property': 'mention-of',
					'wm-private': false,
					rels: {
						canonical: 'https://canonical.example.com'
					},
					name: 'Test Post',
					photo: ['https://example.com/photo.jpg'],
					summary: {
						'content-type': 'text/plain',
						value: 'Summary of the post',
					}
				};

				expect(mockWebmentionsChildren).toBeDefined();
				expect(mockWebmentionsChildren.type).toBe('entry');
				expect(mockWebmentionsChildren.url).toBe('https://example.com/post');
				expect(mockWebmentionsChildren.author?.name).toBe('John Doe');
				expect(mockWebmentionsChildren.content?.html).toBe('<p>Test content</p>');
				expect(mockWebmentionsChildren.summary?.value).toBe('Summary of the post');
			});
		});

		describe('Author', () => {
			it('should match the expected structure', () => {
				const mockAuthor: Author = {
					type: 'card',
					name: 'Jane Smith',
					photo: 'https://example.com/avatar.jpg',
					url: 'https://janesmith.example.com'
				};

				expect(mockAuthor).toBeDefined();
				expect(mockAuthor.type).toBe('card');
				expect(mockAuthor.name).toBe('Jane Smith');
				expect(mockAuthor.photo).toBe('https://example.com/avatar.jpg');
				expect(mockAuthor.url).toBe('https://janesmith.example.com');
			});
		});

		describe('Content', () => {
			it('should match the expected structure', () => {
				const mockContent: Content = {
					'content-type': 'text/html',
					value: 'Sample content',
					html: '<p>Sample content</p>',
					text: 'Sample content'
				};

				expect(mockContent).toBeDefined();
				expect(mockContent['content-type']).toBe('text/html');
				expect(mockContent.value).toBe('Sample content');
				expect(mockContent.html).toBe('<p>Sample content</p>');
				expect(mockContent.text).toBe('Sample content');
			});
		});

		describe('Rels', () => {
			it('should match the expected structure', () => {
				const mockRels: Rels = {
					canonical: 'https://example.com/canonical-url'
				};

				expect(mockRels).toBeDefined();
				expect(mockRels.canonical).toBe('https://example.com/canonical-url');
			});
		});

		describe('Summary', () => {
			it('should match the expected structure', () => {
				const mockSummary: Summary = {
					'content-type': 'text/plain',
					value: 'A brief summary'
				};

				expect(mockSummary).toBeDefined();
				expect(mockSummary['content-type']).toBe('text/plain');
				expect(mockSummary.value).toBe('A brief summary');
			});
		});
	});
});