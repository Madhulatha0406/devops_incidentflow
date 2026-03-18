const { createAnalyticsService } = require("../src/services/analyticsService");

describe("analyticsService", () => {
  test("aggregates dashboard data", async () => {
    const service = createAnalyticsService({
      authService: {
        listUsers: jest.fn().mockResolvedValue([
          { role: "admin" },
          { role: "technician" },
          { role: "student" }
        ])
      },
      incidentService: {
        getDashboardSummary: jest.fn().mockResolvedValue({ total: 2, breached: 1, escalated: 1, byStatus: {} })
      },
      busService: {
        getBuses: jest.fn().mockResolvedValue([{ busId: "BUS-1" }]),
        getDelayAlerts: jest.fn().mockResolvedValue([{ busId: "BUS-1" }])
      },
      featureFlagService: {
        list: jest.fn().mockReturnValue({ incidents: true })
      }
    });

    const dashboard = await service.getDashboard();
    expect(dashboard.usersByRole.student).toBe(1);
    expect(dashboard.buses.delayed).toBe(1);
  });
});
