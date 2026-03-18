const { createRepositories } = require("../src/repositories/createRepositories");
const { createAuthService, normalizeEmail, sanitizeUser } = require("../src/services/authService");
const { defaultUsers } = require("../src/config/defaultUsers");

describe("authService", () => {
  test("normalizeEmail trims and lowercases", () => {
    expect(normalizeEmail(" Student@Mail.COM ")).toBe("student@mail.com");
  });

  test("sanitizeUser removes password hash", () => {
    expect(sanitizeUser({ name: "Test", passwordHash: "hash" })).toEqual({ name: "Test" });
  });

  test("creates users and logs in", async () => {
    const repositories = createRepositories({
      useInMemoryDb: true,
      defaultUsers
    });
    const authService = createAuthService({
      repositories,
      jwtSecret: "secret",
      jwtExpiresIn: "1h"
    });

    const newUser = await authService.createUser({
      name: "New Tech",
      email: "new.tech@example.com",
      password: "Password123!",
      role: "technician"
    });
    const login = await authService.login({
      email: "new.tech@example.com",
      password: "Password123!"
    });

    expect(newUser.role).toBe("technician");
    expect(login.token).toBeTruthy();
    expect(login.user.email).toBe("new.tech@example.com");
  });

  test("prevents duplicate student registration", async () => {
    const repositories = createRepositories({
      useInMemoryDb: true,
      defaultUsers
    });
    const authService = createAuthService({
      repositories,
      jwtSecret: "secret",
      jwtExpiresIn: "1h"
    });

    await expect(
      authService.registerStudent({
        name: "Student Demo",
        email: "student@incidentflow.local",
        password: "Password123!"
      })
    ).rejects.toThrow("User already exists with this email");
  });
});
