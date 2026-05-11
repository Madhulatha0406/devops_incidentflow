const { createRepositories } = require("../src/repositories/createRepositories");
const { defaultUsers } = require("../src/config/defaultUsers");
const { createIncidentService, createActivityEntry, buildIncidentSummary } = require("../src/services/incidentService");

describe("incidentService", () => {
  test("creates activity entries", () => {
    expect(
      createActivityEntry({ _id: "user-1", role: "student" }, "Created", "2026-01-01T00:00:00.000Z")
    ).toEqual({
      actorId: "user-1",
      actorRole: "student",
      message: "Created",
      createdAt: "2026-01-01T00:00:00.000Z"
    });
  });

  test("reports, assigns, closes, finalizes, and escalates incidents", async () => {
    const repositories = createRepositories({
      useInMemoryDb: true,
      defaultUsers
    });
    const nowValues = [
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-01-01T00:05:00.000Z"),
      new Date("2026-01-01T02:30:00.000Z"),
      new Date("2026-01-01T03:00:00.000Z")
    ];
    const incidentService = createIncidentService({
      repositories,
      slaHours: {
        low: 24,
        medium: 12,
        high: 4,
        critical: 1
      },
      nowProvider: () => nowValues.shift() || new Date("2026-01-01T03:00:00.000Z")
    });

    const student = await repositories.users.findByEmail("student@incidentflow.local");
    const admin = await repositories.users.findByEmail("admin@incidentflow.local");
    const technician = await repositories.users.findByEmail("aditya@incidentflow.local");

    const incident = await incidentService.reportIncident(
      {
        title: "Network switch down",
        description: "The lab network is down.",
        priority: "critical"
      },
      student
    );
    const assigned = await incidentService.assignTechnician(incident._id, technician._id, admin);
    const updated = await incidentService.updateStatus(
      incident._id,
      {
        status: "closed",
        resolutionSummary: "Cable replaced and projector restarted."
      },
      technician
    );
    const finalized = await incidentService.updateStatus(
      incident._id,
      {
        status: "completed"
      },
      admin
    );
    const escalated = await incidentService.runEscalationScan();

    expect(assigned.technicianId).toBe(technician._id);
    expect(updated.status).toBe("closed");
    expect(finalized.status).toBe("completed");
    expect(escalated).toHaveLength(0);
  });

  test("records incident workflow metrics and builds dashboard summaries", async () => {
    const repositories = createRepositories({
      useInMemoryDb: true,
      defaultUsers
    });
    const monitoringService = {
      recordIncidentEvent: jest.fn(),
      updateIncidentSnapshot: jest.fn()
    };
    const incidentService = createIncidentService({
      repositories,
      slaHours: {
        low: 24,
        medium: 12,
        high: 4,
        critical: 1
      },
      nowProvider: () => new Date("2026-01-01T00:00:00.000Z"),
      monitoringService
    });
    const student = await repositories.users.findByEmail("student@incidentflow.local");
    const admin = await repositories.users.findByEmail("admin@incidentflow.local");
    const technician = await repositories.users.findByEmail("aditya@incidentflow.local");

    const incident = await incidentService.reportIncident(
      {
        title: "Router reboot needed",
        description: "Router is unstable",
        priority: "high"
      },
      student
    );
    await incidentService.assignTechnician(incident._id, technician._id, admin);
    await incidentService.updateStatus(
      incident._id,
      {
        status: "closed",
        resolutionSummary: "Router firmware updated"
      },
      technician
    );

    expect(monitoringService.recordIncidentEvent).toHaveBeenCalledWith({
      action: "created",
      priority: "high",
      status: "open",
      actorRole: "student"
    });
    expect(monitoringService.recordIncidentEvent).toHaveBeenCalledWith({
      action: "assigned",
      priority: "high",
      status: "assigned",
      actorRole: "admin"
    });
    expect(monitoringService.recordIncidentEvent).toHaveBeenCalledWith({
      action: "status_updated",
      priority: "high",
      status: "closed",
      actorRole: "technician"
    });
    expect(monitoringService.updateIncidentSnapshot).toHaveBeenCalled();

    const summary = buildIncidentSummary(await repositories.incidents.list(), () => new Date("2026-01-01T00:00:00.000Z"));
    expect(summary.total).toBe(1);
    expect(summary.byStatus.closed).toBe(1);
  });

  test("records escalation metrics for breached incidents", async () => {
    const repositories = createRepositories({
      useInMemoryDb: true,
      defaultUsers
    });
    const monitoringService = {
      recordIncidentEvent: jest.fn(),
      updateIncidentSnapshot: jest.fn()
    };
    const timestamps = [
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-01-01T02:30:00.000Z")
    ];
    const incidentService = createIncidentService({
      repositories,
      slaHours: {
        low: 24,
        medium: 12,
        high: 4,
        critical: 1
      },
      nowProvider: () => timestamps.shift() || new Date("2026-01-01T02:30:00.000Z"),
      monitoringService
    });
    const student = await repositories.users.findByEmail("student@incidentflow.local");

    await incidentService.reportIncident(
      {
        title: "Core switch outage",
        description: "Entire lab segment is down",
        priority: "critical"
      },
      student
    );
    const escalated = await incidentService.runEscalationScan();

    expect(escalated).toHaveLength(1);
    expect(monitoringService.recordIncidentEvent).toHaveBeenCalledWith({
      action: "escalated",
      priority: "critical",
      status: "open",
      actorRole: "system"
    });
    expect(monitoringService.updateIncidentSnapshot).toHaveBeenCalled();
  });
});
