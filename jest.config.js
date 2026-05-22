const { defaults: tsjPreset } = require('ts-jest/presets');

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  transform: {
    ...tsjPreset.transform,
    '^.+\\.[jt]sx?$': ['ts-jest', {
      astTransformers: {
        before: ['ts-jest/src/transformers/verbatim-identifiers.ts', 'ts-jest/src/transformers/remove-comments.ts']
      },
      tsconfig: 'tsconfig.json',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@swc/helpers|reading-time|mdast-util-to-string|unist-util-visit|unist-util-is|longest-streak|ccount|character-entities-html4|character-entities-legacy|decode-named-character-reference|micromark-util-.*|vfile-message|vfile|unist-util-.*|bail|trough|is-plain-obj|devlop|property-information|space-separated-tokens|web-namespaces|xmldom|xml-js|zwitch|vfile-location|vfile-statistics|vfile-sort|vfile-matter|remark-.*|rehype-.*|micromark|@babel)/)'
  ],
  moduleNameMapper: {
    "^@/assets/(.*)$": "<rootDir>/src/assets/$1",
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/data/(.*)$": "<rootDir>/src/data/$1",
    "^@/layouts/(.*)$": "<rootDir>/src/layouts/$1",
    "^@/utils$": "<rootDir>/src/utils/index.ts",
    "^@/types$": "<rootDir>/src/types.ts",
    "^@/site-config$": "<rootDir>/src/site.config.ts",
    "^astro:content$": "<rootDir>/__mocks__/astro-content.js"
  },
  globals: {
    "importMeta": {
      env: {
        PROD: false,
        SITE: "https://example.com"
      }
    }
  }
};