const { createApplicationContext, createRuntime } = require("../src/bootstrap");
const { createRepositories } = require("../src/repositories/createRepositories");
const { defaultUsers } = require("../src/config/defaultUsers");
const { createAuthService } = require("../src/services/authService");
const { createIncidentService } = require("../src/services/incidentService");
const { createFeatureFlagService } = require("../src/services/featureFlagService");
const { createMonitoringService } = require("../src/services/monitoringService");
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

  test("monitoring service exposes prometheus metrics", async () => {
    const service = createMonitoringService({
      activeColor: "green",
      nodeEnv: "test",
      featureFlags: {
        incidents: true
      }
    });

    service.updateFeatureFlags({ incidents: false });
    service.recordAuthAttempt({ action: "login", outcome: "success", role: "student" });
    service.recordIncidentEvent({
      action: "created",
      priority: "high",
      status: "open",
      actorRole: "student"
    });
    service.observeRepositoryOperation({
      repository: "users",
      operation: "findByEmail",
      mode: "memory",
      outcome: "success",
      durationSeconds: 0.01
    });
    service.setDatabaseConnectionState({
      mode: "memory",
      connected: false
    });
    service.updateIncidentSnapshot({
      total: 2,
      breached: 1,
      escalated: 1,
      byStatus: {
        open: 1,
        completed: 1
      }
    });
    const metrics = await service.metrics();
    expect(metrics).toContain("incidentflow_http_requests_total");
    expect(metrics).toContain('flag="incidents"');
    expect(metrics).toContain("incidentflow_auth_attempts_total");
    expect(metrics).toContain("incidentflow_incident_events_total");
    expect(metrics).toContain("incidentflow_repository_operations_total");
    expect(metrics).toContain("incidentflow_database_connected");
    expect(metrics).toContain('status="completed"');
  });

  test("bootstrap and runtime create complete application context", async () => {
    const logger = createMockLogger();
    const context = await createApplicationContext({
      logger,
      env: {
        nodeEnv: "test",
        useInMemoryDb: true,
        jwtSecret: "secret"
      }
    });

    expect(context.app).toBeTruthy();
    expect(context.services.featureFlagService.list().incidents).toBe(true);

    const runtime = await createRuntime({
      logger,
      env: {
        nodeEnv: "test",
        useInMemoryDb: true,
        jwtSecret: "secret",
        escalationScanIntervalMs: 99999
      }
    });

    runtime.escalationMonitorJob.stop();
    runtime.io.close();
    runtime.server.close();

    expect(runtime.server).toBeTruthy();
  });

  test("bootstrap reports database connection failures", async () => {
    const logger = createMockLogger();

    await expect(
      createApplicationContext({
        logger,
        env: {
          nodeEnv: "test",
          useInMemoryDb: false,
          mongoUri: "mongodb://invalid-host",
          jwtSecret: "secret"
        },
        mongooseInstance: {
          connect: jest.fn().mockRejectedValue(new Error("database unavailable"))
        }
      })
    ).rejects.toThrow("database unavailable");
  });
});
