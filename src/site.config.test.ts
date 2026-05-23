import { siteConfig, menuLinks, expressiveCodeOptions } from "./site.config";
import type { SiteConfig } from "@/types";

describe("site.config.ts", () => {
	describe("siteConfig", () => {
		it("should be defined", () => {
			expect(siteConfig).toBeDefined();
		});

		it("should match the expected structure", () => {
			const expectedStructure: Partial<SiteConfig> = {
				author: expect.any(String),
				title: expect.any(String),
				description: expect.any(String),
				lang: expect.any(String),
				ogLocale: expect.any(String),
				date: {
					locale: expect.any(String),
					options: expect.objectContaining({
						day: expect.any(String),
						month: expect.any(String),
						year: expect.any(String),
					}),
				},
			};

			expect(siteConfig).toMatchObject(expectedStructure);
		});

		it("should have correct author value", () => {
			expect(siteConfig.author).toBe("Luca Faggianelli");
		});

		it("should have correct title value", () => {
			expect(siteConfig.title).toBe("Luca Faggianelli");
		});

		it("should have correct description value", () => {
			expect(siteConfig.description).toBe("A random dump of my discoveries and thoughts.");
		});

		it("should have correct lang value", () => {
			expect(siteConfig.lang).toBe("en-GB");
		});

		it("should have correct ogLocale value", () => {
			expect(siteConfig.ogLocale).toBe("en_GB");
		});

		it("should have correct date configuration", () => {
			expect(siteConfig.date.locale).toBe("en-GB");
			expect(siteConfig.date.options).toEqual({
				day: "numeric",
				month: "short",
				year: "numeric",
			});
		});
	});

	describe("menuLinks", () => {
		it("should be defined", () => {
			expect(menuLinks).toBeDefined();
		});

		it("should be an array", () => {
			expect(Array.isArray(menuLinks)).toBe(true);
		});

		it("should have the correct length", () => {
			expect(menuLinks).toHaveLength(3);
		});

		it("should have correct menu link structure", () => {
			const expectedMenuLinks = [
				{
					title: "Home",
					path: "/",
				},
				{
					title: "About",
					path: "/about/",
				},
				{
					title: "Blog",
					path: "/posts/",
				},
			];

			expect(menuLinks).toEqual(expectedMenuLinks);

			// Also verify each item has the correct properties
			menuLinks.forEach((link) => {
				expect(link).toHaveProperty("title");
				expect(link).toHaveProperty("path");
				expect(typeof link.title).toBe("string");
				expect(typeof link.path).toBe("string");
			});
		});
	});

	describe("expressiveCodeOptions", () => {
		it("should be defined", () => {
			expect(expressiveCodeOptions).toBeDefined();
		});

		it("should have themes property", () => {
			expect(expressiveCodeOptions).toHaveProperty("themes");
			expect(Array.isArray(expressiveCodeOptions.themes)).toBe(true);
			expect(expressiveCodeOptions.themes).toEqual(["dracula", "github-light"]);
		});

		it("should have themeCssSelector function", () => {
			expect(expressiveCodeOptions).toHaveProperty("themeCssSelector");
			expect(typeof expressiveCodeOptions.themeCssSelector).toBe("function");
			
			// Test the function with sample data
			const mockTheme = { name: "test-theme", type: "dark" };
			const mockStyleVariants = [
				{ theme: { name: "dark-theme", type: "dark" } },
				{ theme: { name: "light-theme", type: "light" } }
			];
			
			const result = expressiveCodeOptions.themeCssSelector(mockTheme, { styleVariants: [mockStyleVariants[0]] });
			expect(result).toBeDefined();
		});

		it("should have correct boolean options", () => {
			expect(expressiveCodeOptions.useThemedScrollbars).toBe(false);
		});

		it("should have correct styleOverrides structure", () => {
			expect(expressiveCodeOptions).toHaveProperty("styleOverrides");
			expect(expressiveCodeOptions.styleOverrides).toHaveProperty("frames");
			expect(expressiveCodeOptions.styleOverrides).toHaveProperty("uiLineHeight");
			expect(expressiveCodeOptions.styleOverrides).toHaveProperty("codeFontSize");
			expect(expressiveCodeOptions.styleOverrides).toHaveProperty("codeLineHeight");
			expect(expressiveCodeOptions.styleOverrides).toHaveProperty("borderRadius");
			expect(expressiveCodeOptions.styleOverrides).toHaveProperty("codePaddingInline");
			expect(expressiveCodeOptions.styleOverrides).toHaveProperty("codeFontFamily");

			expect(expressiveCodeOptions.styleOverrides.frames).toEqual({
				frameBoxShadowCssValue: "none",
			});
			expect(expressiveCodeOptions.styleOverrides.uiLineHeight).toBe("inherit");
		});
	});
});