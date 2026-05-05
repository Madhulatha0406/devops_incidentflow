module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx"
  ],
  moduleNameMapper: {
    "\\.(css)$": "<rootDir>/tests/styleMock.js"
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"]
};
