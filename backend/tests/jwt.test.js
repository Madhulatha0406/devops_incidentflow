const { signToken, verifyToken } = require("../src/utils/jwt");

describe("jwt helpers", () => {
  test("signs and verifies a token", () => {
    const token = signToken({ sub: "user-1", role: "student" }, "secret", "1h");
    const payload = verifyToken(token, "secret");
    expect(payload.sub).toBe("user-1");
    expect(payload.role).toBe("student");
  });
});
