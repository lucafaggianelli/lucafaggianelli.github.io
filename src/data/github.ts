export const getGithubProject = async (projectSlug: string) => {
	const response = await fetch(`https://api.github.com/repos/${projectSlug}`);
	const project = await response.json();

	const htmlPage = await (await fetch(project.html_url)).text();

	// search for the meta tag content with property="og:image"
	const m = htmlPage.match(/<meta property="og:image" content="(https.+?)"/);
	if (m) {
		project.image = m[1];
	}

	return {
		name: project.name,
		description: project.description,
		stars: project.stargazers_count,
		url: project.html_url,
		homepage: project.homepage,
		image: project.image,
	};
};
