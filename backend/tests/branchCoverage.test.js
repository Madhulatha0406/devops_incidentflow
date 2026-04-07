const { createApplicationContext, createRuntime } = require("../src/bootstrap");
const { createRepositories } = require("../src/repositories/createRepositories");
const { defaultUsers } = require("../src/config/defaultUsers");
const { createAuthService } = require("../src/services/authService");
const { createIncidentService } = require("../src/services/incidentService");
const { createBusService } = require("../src/services/busService");
const { createAICorrectionService, scoreCoverage } = require("../src/services/aiCorrectionService");
const { createFeatureFlagService } = require("../src/services/featureFlagService");
const { createLogger } = require("../src/config/logger");
const { createMockLogger } = require("./helpers");

describe("additional branch coverage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("logger writes warn and error messages", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const logger = createLogger("debug");
    logger.warn("warn message");
    logger.error("error message");
    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  test("feature flag service rejects unknown flags", () => {
    const service = createFeatureFlagService({ incidents: true });
    expect(() => service.setFlag("unknown", true)).toThrow("Unknown feature flag");
  });

  test("auth service rejects invalid credentials", async () => {
    const repositories = createRepositories({ useInMemoryDb: true, defaultUsers });
    const service = createAuthService({
      repositories,
      jwtSecret: "secret",
      jwtExpiresIn: "1h"
    });

    await expect(service.login({ email: "missing@example.com", password: "Password123!" })).rejects.toThrow(
      "Invalid email or password"
    );
    await expect(service.login({ email: "student@incidentflow.local", password: "wrong" })).rejects.toThrow(
      "Invalid email or password"
    );
    expect(await service.getUserById("missing")).toBeNull();
  });

  test("incident service branches for role filtering and invalid operations", async () => {
    const repositories = createRepositories({ useInMemoryDb: true, defaultUsers });
    const service = createIncidentService({
      repositories,
      slaHours: { low: 24, medium: 12, high: 4, critical: 1 },
      nowProvider: () => new Date("2026-01-01T00:00:00.000Z")
    });
    const student = await repositories.users.findByEmail("student@incidentflow.local");
    const admin = await repositories.users.findByEmail("admin@incidentflow.local");
    const technician = await repositories.users.findByEmail("aditya@incidentflow.local");

    const incident = await service.reportIncident(
      {
        title: "VPN issue",
        description: "Campus VPN disconnected",
        priority: "medium"
      },
      student
    );

    expect((await service.getIncidentsForUser(admin)).length).toBe(1);
    expect((await service.getIncidentsForUser(student)).length).toBe(1);
    expect((await service.getIncidentsForUser(technician)).length).toBe(0);

    await expect(service.assignTechnician("missing", technician._id, admin)).rejects.toThrow("Incident not found");
    await expect(service.assignTechnician(incident._id, student._id, admin)).rejects.toThrow("Technician not found");
    await expect(service.updateStatus(incident._id, { status: "resolved" }, technician)).rejects.toThrow(
      "Technician is not assigned to this incident"
    );
    await expect(service.updateStatus(incident._id, { status: "completed" }, admin)).rejects.toThrow(
      "Admin can finalize incidents only after technician closure"
    );
    expect(await service.runEscalationScan()).toEqual([]);
  });

  test("bus service covers bootstrap existing state and simulation", async () => {
    const repositories = createRepositories({ useInMemoryDb: true, defaultUsers: [] });
    const service = createBusService({
      repositories,
      nowProvider: () => new Date("2026-01-01T00:00:00.000Z")
    });

    await repositories.buses.saveAll([{ busId: "BUS-X", delayMinutes: 0 }]);
    expect((await service.bootstrap())[0].busId).toBe("BUS-X");
    expect((await service.advanceSimulation())[0]).toHaveProperty("busId");
    expect(await service.getDelayAlerts()).toEqual([]);
  });

  test("ai correction service handles missing data and empty rubric coverage", () => {
    expect(scoreCoverage(["network"], [])).toBe(0);
    const service = createAICorrectionService();
    expect(() => service.analyzeAnswer({ answer: "", rubric: "" })).toThrow("Both answer and rubric are required");
  });

  test("bootstrap and runtime create complete application context", async () => {
    const logger = createMockLogger();
    const context = await createApplicationContext({
      logger,
      env: {
        useInMemoryDb: true,
        jwtSecret: "secret"
      }
    });

    expect(context.app).toBeTruthy();
    expect(context.services.featureFlagService.list().incidents).toBe(true);

    const runtime = await createRuntime({
      logger,
      env: {
        useInMemoryDb: true,
        jwtSecret: "secret",
        busUpdateIntervalMs: 99999
      }
    });

    runtime.busTrackerJob.stop();
    runtime.escalationMonitorJob.stop();
    runtime.io.close();
    runtime.server.close();

    expect(runtime.server).toBeTruthy();
  });
});
