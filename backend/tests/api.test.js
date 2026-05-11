const request = require("supertest");
const { createTestContext, loginAndGetToken } = require("./helpers");

describe("API integration", () => {
  test(
    "supports auth, incidents, admin workflow, metrics, and feature toggles",
    async () => {
    const context = await createTestContext();
    const { app } = context;

    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.body.status).toBe("ok");
    expect(health.body.monitoring).toEqual({
      provider: "prometheus",
      metricsPath: "/metrics"
    });

    const metrics = await request(app).get("/metrics");
    expect(metrics.status).toBe(200);
    expect(metrics.headers["content-type"]).toContain("text/plain");
    expect(metrics.text).toContain("incidentflow_http_requests_total");
    expect(metrics.text).toContain("incidentflow_http_request_size_bytes");
    expect(metrics.text).toContain("incidentflow_http_response_size_bytes");
    expect(metrics.text).toContain("incidentflow_repository_operations_total");

    const register = await request(app).post("/api/auth/register").send({
      name: "Asha Student",
      email: "asha@student.local",
      password: "Password123!"
    });
    expect(register.status).toBe(201);

    const studentToken = await loginAndGetToken(app, "asha@student.local");
    const adminToken = await loginAndGetToken(app, "admin@incidentflow.local");
    const technicianToken = await loginAndGetToken(app, "aditya@incidentflow.local");

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
    const technician = usersResponse.body.users.find((user) => user.email === "aditya@incidentflow.local");

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
        status: "closed",
        resolutionSummary: "Replaced the projector cable."
      });
    expect(updated.status).toBe(200);

    const finalized = await request(app)
      .patch(`/api/incidents/${createdIncident.body.incident._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "completed",
        resolutionSummary: "Admin verified the classroom is operational."
      });
    expect(finalized.status).toBe(200);

    const incidents = await request(app)
      .get("/api/incidents")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(incidents.body.incidents).toHaveLength(1);
    expect(incidents.body.incidents[0].status).toBe("completed");

    const dashboard = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.dashboard).toHaveProperty("usersByRole");

    const flagUpdate = await request(app)
      .patch("/api/admin/feature-flags/incidents")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        enabled: false
      });
    expect(flagUpdate.status).toBe(200);

    const disabledIncidentModule = await request(app)
      .get("/api/incidents")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(disabledIncidentModule.status).toBe(503);

    const enrichedMetrics = await request(app).get("/metrics");
    expect(enrichedMetrics.text).toContain('incidentflow_auth_attempts_total{action="login",outcome="success",role="student"');
    expect(enrichedMetrics.text).toContain('incidentflow_incident_events_total{action="created"');
    expect(enrichedMetrics.text).toContain('incidentflow_incident_events_total{action="assigned"');
    expect(enrichedMetrics.text).toContain('incidentflow_incident_events_total{action="status_updated"');
    expect(enrichedMetrics.text).toContain("incidentflow_incidents_total");
    expect(enrichedMetrics.text).toContain('incidentflow_incidents_by_status{status="completed"');
    },
    20000
  );
});
