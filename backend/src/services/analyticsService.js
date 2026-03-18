const createAnalyticsService = ({ authService, incidentService, busService, featureFlagService }) => ({
  getDashboard: async () => {
    const [users, incidents, buses, delayAlerts] = await Promise.all([
      authService.listUsers(),
      incidentService.getDashboardSummary(),
      busService.getBuses(),
      busService.getDelayAlerts()
    ]);

    const usersByRole = users.reduce((summary, user) => {
      summary[user.role] = (summary[user.role] || 0) + 1;
      return summary;
    }, {});

    return {
      usersByRole,
      incidents,
      buses: {
        active: buses.length,
        delayed: delayAlerts.length
      },
      featureFlags: featureFlagService.list()
    };
  }
});

module.exports = {
  createAnalyticsService
};
