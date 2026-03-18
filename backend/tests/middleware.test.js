const { createAuthenticate, authorize } = require("../src/middleware/auth");
const { createErrorHandler, notFoundHandler } = require("../src/middleware/errorHandler");
const { requireFeature } = require("../src/middleware/featureToggle");
const { createMockLogger } = require("./helpers");
const { signToken } = require("../src/utils/jwt");

describe("middleware branches", () => {
  test("authenticate rejects missing bearer token", async () => {
    const middleware = createAuthenticate({
      authService: { getUserById: jest.fn() },
      jwtSecret: "secret"
    });
    const next = jest.fn();

    await middleware({ headers: {} }, {}, next);
    expect(next.mock.calls[0][0].message).toBe("Authentication token is required");
  });

  test("authenticate rejects invalid token or unknown user", async () => {
    const nextInvalid = jest.fn();
    const middlewareInvalid = createAuthenticate({
      authService: { getUserById: jest.fn() },
      jwtSecret: "secret"
    });

    await middlewareInvalid({ headers: { authorization: "Bearer bad-token" } }, {}, nextInvalid);
    expect(nextInvalid.mock.calls[0][0].message).toBe("Invalid or expired token");

    const nextMissingUser = jest.fn();
    const middlewareMissingUser = createAuthenticate({
      authService: { getUserById: jest.fn().mockResolvedValue(null) },
      jwtSecret: "secret"
    });
    const token = signToken({ sub: "missing-user" }, "secret", "1h");

    await middlewareMissingUser({ headers: { authorization: `Bearer ${token}` } }, {}, nextMissingUser);
    expect(nextMissingUser.mock.calls[0][0].message).toBe("Authenticated user was not found");
  });

  test("authorize rejects missing or invalid roles", () => {
    const nextMissing = jest.fn();
    authorize("admin")({}, {}, nextMissing);
    expect(nextMissing.mock.calls[0][0].message).toBe("Authentication is required");

    const nextForbidden = jest.fn();
    authorize("admin")({ user: { role: "student" } }, {}, nextForbidden);
    expect(nextForbidden.mock.calls[0][0].message).toBe("You are not allowed to access this resource");
  });

  test("feature toggle middleware rejects disabled features", () => {
    const next = jest.fn();
    requireFeature({ isEnabled: jest.fn().mockReturnValue(false) }, "busTracking")({}, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(503);
  });

  test("error handlers build API response", () => {
    const logger = createMockLogger();
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    notFoundHandler({}, {}, (error) => {
      expect(error.statusCode).toBe(404);
    });

    createErrorHandler(logger)(
      { message: "Boom", statusCode: 400, details: { field: "email" } },
      {},
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Boom",
      details: { field: "email" }
    });
  });
});
