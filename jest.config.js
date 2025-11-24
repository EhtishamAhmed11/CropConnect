export default {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "utils/**/*.js",
    "middleware/**/*.js",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: ["dotenv/config"],
  setupFilesAfterEnv: ["<rootDir>/Backend/tests/setup.js"],
  globalTeardown: "<rootDir>/Backend/tests/teardown.js",
  testTimeout: 10000,
  verbose: true,
  transform: {},
};
