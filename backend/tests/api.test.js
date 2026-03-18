const request = require("supertest");
const { createTestContext, loginAndGetToken } = require("./helpers");

describe("API integration", () => {
  test("supports auth, incidents, admin dashboard, buses, AI, and feature toggles", async () => {
    const context = await createTestContext();
    const { app } = context;

    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.body.status).toBe("ok");

    const register = await request(app).post("/api/auth/register").send({
      name: "Asha Student",
      email: "asha@student.local",
      password: "Password123!"
    });
    expect(register.status).toBe(201);

    const studentToken = await loginAndGetToken(app, "asha@student.local");
    const adminToken = await loginAndGetToken(app, "admin@incidentflow.local");
    const technicianToken = await loginAndGetToken(app, "tech@incidentflow.local");

    const createdIncident = await request(app)
      .post("/api/incidents")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        title: "Projector not working",
        description: "The classroom projector is failing to start.",
        priority: "high",
        category: "Classroom IT"
      });

    expect(createdIncident.status).toBe(201);

    const usersResponse = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    const technician = usersResponse.body.users.find((user) => user.role === "technician");

    const assigned = await request(app)
      .patch(`/api/incidents/${createdIncident.body.incident._id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        technicianId: technician._id
      });
    expect(assigned.status).toBe(200);

    const updated = await request(app)
      .patch(`/api/incidents/${createdIncident.body.incident._id}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({
        status: "resolved",
        resolutionSummary: "Replaced the projector cable."
      });
    expect(updated.status).toBe(200);

    const incidents = await request(app)
      .get("/api/incidents")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(incidents.body.incidents).toHaveLength(1);

    const buses = await request(app)
      .get("/api/buses")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(buses.status).toBe(200);
    expect(buses.body.buses.length).toBeGreaterThan(0);

    const analysis = await request(app)
      .post("/api/ai/correct")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        question: "Explain failover",
        answer: "Failover keeps services running because there is a backup system.",
        rubric: "Define failover, backup systems, availability, and monitoring."
      });
    expect(analysis.status).toBe(200);
    expect(analysis.body.analysis).toHaveProperty("verdict");

    const dashboard = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.dashboard).toHaveProperty("usersByRole");

    const flagUpdate = await request(app)
      .patch("/api/admin/feature-flags/busTracking")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        enabled: false
      });
    expect(flagUpdate.status).toBe(200);

    const disabledBusModule = await request(app)
      .get("/api/buses")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(disabledBusModule.status).toBe(503);
  });
});
