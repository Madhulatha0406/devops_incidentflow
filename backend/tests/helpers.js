const request = require("supertest");
const { createApplicationContext } = require("../src/bootstrap");

const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockImplementation(() => createMockLogger())
});

const createTestContext = async (overrides = {}) =>
  createApplicationContext({
    logger: createMockLogger(),
    env: {
      useInMemoryDb: true,
      jwtSecret: "test-secret",
      jwtExpiresIn: "1h",
      ...overrides.env
    },
    nowProvider: overrides.nowProvider
  });

const loginAndGetToken = async (app, email, password = "Password123!") => {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  return response.body.token;
};

module.exports = {
  createMockLogger,
  createTestContext,
  loginAndGetToken
};
