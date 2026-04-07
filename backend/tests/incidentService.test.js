const { createRepositories } = require("../src/repositories/createRepositories");
const { defaultUsers } = require("../src/config/defaultUsers");
const { createIncidentService, createActivityEntry } = require("../src/services/incidentService");

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
    const technician = await repositories.users.findByEmail("tech@incidentflow.local");

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
});
