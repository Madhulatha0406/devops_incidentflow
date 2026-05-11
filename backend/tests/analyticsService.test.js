const { createAnalyticsService } = require("../src/services/analyticsService");

describe("analyticsService", () => {
  test("aggregates dashboard data", async () => {
    const service = createAnalyticsService({
      authService: {
        listUsers: jest.fn().mockResolvedValue([{ role: "admin" }, { role: "technician" }, { role: "student" }])
      },
      incidentService: {
        getDashboardSummary: jest.fn().mockResolvedValue({ total: 2, breached: 1, escalated: 1, byStatus: {} })
      },
      featureFlagService: {
        list: jest.fn().mockReturnValue({ incidents: true })
      }
    });

    const dashboard = await service.getDashboard();
    expect(dashboard.usersByRole.student).toBe(1);
    expect(dashboard.incidents.breached).toBe(1);
    expect(dashboard.featureFlags.incidents).toBe(true);
  });
});
