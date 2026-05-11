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
      role: "technician",
      specialty: "Electrician"
    });
    const login = await authService.login({
      email: "new.tech@example.com",
      password: "Password123!"
    });

    expect(newUser.role).toBe("technician");
    expect(newUser.specialty).toBe("Electrician");
    expect(login.token).toBeTruthy();
    expect(login.user.email).toBe("new.tech@example.com");
  });

  test("records auth outcomes for registration and login", async () => {
    const repositories = createRepositories({
      useInMemoryDb: true,
      defaultUsers
    });
    const monitoringService = {
      recordAuthAttempt: jest.fn()
    };
    const authService = createAuthService({
      repositories,
      jwtSecret: "secret",
      jwtExpiresIn: "1h",
      monitoringService
    });

    await authService.registerStudent({
      name: "Metrics Student",
      email: "metrics@student.local",
      password: "Password123!"
    });
    await authService.login({
      email: "metrics@student.local",
      password: "Password123!"
    });

    await expect(
      authService.login({
        email: "metrics@student.local",
        password: "WrongPassword!"
      })
    ).rejects.toThrow("Invalid email or password");

    expect(monitoringService.recordAuthAttempt).toHaveBeenCalledWith({
      action: "register",
      outcome: "success",
      role: "student"
    });
    expect(monitoringService.recordAuthAttempt).toHaveBeenCalledWith({
      action: "login",
      outcome: "success",
      role: "student"
    });
    expect(monitoringService.recordAuthAttempt).toHaveBeenCalledWith({
      action: "login",
      outcome: "failure",
      role: "student"
    });
  });

  test("prevents duplicate student registration", async () => {
    const repositories = createRepositories({
      useInMemoryDb: true,
      defaultUsers
    });
    const monitoringService = {
      recordAuthAttempt: jest.fn()
    };
    const authService = createAuthService({
      repositories,
      jwtSecret: "secret",
      jwtExpiresIn: "1h",
      monitoringService
    });

    await expect(
      authService.registerStudent({
        name: "Student Demo",
        email: "student@incidentflow.local",
        password: "Password123!"
      })
    ).rejects.toThrow("User already exists with this email");
    expect(monitoringService.recordAuthAttempt).toHaveBeenCalledWith({
      action: "register",
      outcome: "failure",
      role: "student"
    });
  });
});
