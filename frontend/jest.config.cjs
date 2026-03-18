module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "\\.(css)$": "<rootDir>/tests/styleMock.js"
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"]
};
