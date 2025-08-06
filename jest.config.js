// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  testTimeout: 10000,
  clearMocks: true,

  // Transform ES6 modules for Jest
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: "commonjs",
            },
          ],
        ],
      },
    ],
  },

  // Test file patterns
  testMatch: [
    "<rootDir>/tests/**/*.test.js", // only for jest to run test
    // '<rootDir>/tests/**/*.spec.js'  // only for playwright test
  ],

  testPathIgnorePatterns: [
    "/tests/e2e/", // ignore E2E tests (Playwright)
    "/node_modules/",
    "src/indexM2.js",
    "\\.spec\\.js$", // extra safeguard to prevent jest from running E2E tests
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Files to include in coverage
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/indexM2.js",
    "!**/node_modules/**",
  ],

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Module paths
  moduleDirectories: ["node_modules", "src"],
  moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node"],
};
