import { getGithubProject } from './github';

// Mock fetch globally
global.fetch = jest.fn();

describe('getGithubProject', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should fetch and return project data correctly', async () => {
		const mockProjectData = {
			name: 'test-repo',
			description: 'A test repository',
			stargazers_count: 42,
			html_url: 'https://github.com/user/test-repo',
			homepage: 'https://example.com',
		};

		const mockHtmlContent = `
			<html>
				<head>
					<meta property="og:image" content="https://opengraph-image.example.com/user/test-repo" />
				</head>
			</html>
		`;

		(global.fetch as jest.MockedFunction<typeof fetch>)
			.mockResolvedValueOnce({
				json: async () => mockProjectData,
			} as Response)
			.mockResolvedValueOnce({
				text: async () => mockHtmlContent,
			} as Response);

		const result = await getGithubProject('user/test-repo');

		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch).toHaveBeenCalledWith('https://api.github.com/repos/user/test-repo');
		expect(fetch).toHaveBeenCalledWith('https://github.com/user/test-repo');

		expect(result).toEqual({
			name: 'test-repo',
			description: 'A test repository',
			stars: 42,
			url: 'https://github.com/user/test-repo',
			homepage: 'https://example.com',
			image: 'https://opengraph-image.example.com/user/test-repo',
		});
	});

	it('should handle project without og:image meta tag', async () => {
		const mockProjectData = {
			name: 'test-repo',
			description: 'A test repository',
			stargazers_count: 42,
			html_url: 'https://github.com/user/test-repo',
			homepage: null,
		};

		const mockHtmlContent = `
			<html>
				<head>
					<title>Test Repository</title>
				</head>
			</html>
		`;

		(global.fetch as jest.MockedFunction<typeof fetch>)
			.mockResolvedValueOnce({
				json: async () => mockProjectData,
			} as Response)
			.mockResolvedValueOnce({
				text: async () => mockHtmlContent,
			} as Response);

		const result = await getGithubProject('user/test-repo');

		expect(result).toEqual({
			name: 'test-repo',
			description: 'A test repository',
			stars: 42,
			url: 'https://github.com/user/test-repo',
			homepage: null,
			image: undefined,
		});
	});

	it('should handle project with empty homepage', async () => {
		const mockProjectData = {
			name: 'test-repo',
			description: '',
			stargazers_count: 0,
			html_url: 'https://github.com/user/test-repo',
			homepage: '',
		};

		const mockHtmlContent = `
			<html>
				<head>
					<meta property="og:image" content="https://opengraph-image.example.com/user/test-repo" />
				</head>
			</html>
		`;

		(global.fetch as jest.MockedFunction<typeof fetch>)
			.mockResolvedValueOnce({
				json: async () => mockProjectData,
			} as Response)
			.mockResolvedValueOnce({
				text: async () => mockHtmlContent,
			} as Response);

		const result = await getGithubProject('user/test-repo');

		expect(result).toEqual({
			name: 'test-repo',
			description: '',
			stars: 0,
			url: 'https://github.com/user/test-repo',
			homepage: '',
			image: 'https://opengraph-image.example.com/user/test-repo',
		});
	});

	it('should handle fetch errors gracefully', async () => {
		(global.fetch as jest.MockedFunction<typeof fetch>)
			.mockRejectedValueOnce(new Error('Network error'));

		await expect(getGithubProject('user/test-repo')).rejects.toThrow('Network error');
	});

	it('should handle invalid response scenario', async () => {
		const mockProjectData = {
			name: 'test-repo',
			description: 'A test repository',
			stargazers_count: 99,
			html_url: 'https://github.com/user/test-repo',
			homepage: 'https://another-example.com',
		};

		// Simulating an error in the second fetch call
		(global.fetch as jest.MockedFunction<typeof fetch>)
			.mockResolvedValueOnce({
				json: async () => mockProjectData,
			} as Response)
			.mockRejectedValueOnce(new Error('HTML fetch failed'));

		await expect(getGithubProject('user/test-repo')).rejects.toThrow('HTML fetch failed');
	});

	it('should handle malformed og:image meta tag with empty content', async () => {
		const mockProjectData = {
			name: 'test-repo',
			description: 'A test repository',
			stargazers_count: 33,
			html_url: 'https://github.com/user/test-repo',
			homepage: 'https://homepage.example.com',
		};

		const mockHtmlContentWithInvalidMeta = `
			<html>
				<head>
					<meta property="og:image" content="" />
				</head>
			</html>
		`;

		(global.fetch as jest.MockedFunction<typeof fetch>)
			.mockResolvedValueOnce({
				json: async () => mockProjectData,
			} as Response)
			.mockResolvedValueOnce({
				text: async () => mockHtmlContentWithInvalidMeta,
			} as Response);

		const result = await getGithubProject('user/test-repo');

		// With empty content attribute, the regex won't match because it looks for https.+ (requires at least one char after https)
		expect(result).toEqual({
			name: 'test-repo',
			description: 'A test repository',
			stars: 33,
			url: 'https://github.com/user/test-repo',
			homepage: 'https://homepage.example.com',
			image: undefined,
		});
	});

	it('should handle malformed og:image meta tag with non-HTTPS URL', async () => {
		const mockProjectData = {
			name: 'test-repo',
			description: 'A test repository',
			stargazers_count: 33,
			html_url: 'https://github.com/user/test-repo',
			homepage: 'https://homepage.example.com',
		};

		const mockHtmlContentWithHttpUrl = `
			<html>
				<head>
					<meta property="og:image" content="http://opengraph-image.example.com/user/test-repo" />
				</head>
			</html>
		`;

		(global.fetch as jest.MockedFunction<typeof fetch>)
			.mockResolvedValueOnce({
				json: async () => mockProjectData,
			} as Response)
			.mockResolvedValueOnce({
				text: async () => mockHtmlContentWithHttpUrl,
			} as Response);

		const result = await getGithubProject('user/test-repo');

		// With HTTP URL, the regex won't match because it looks for HTTPS URLs
		expect(result).toEqual({
			name: 'test-repo',
			description: 'A test repository',
			stars: 33,
			url: 'https://github.com/user/test-repo',
			homepage: 'https://homepage.example.com',
			image: undefined,
		});
	});
});