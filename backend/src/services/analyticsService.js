const createAnalyticsService = ({ authService, incidentService, featureFlagService }) => ({
  getDashboard: async () => {
    const [users, incidents] = await Promise.all([
      authService.listUsers(),
      incidentService.getDashboardSummary()
    ]);

    const usersByRole = users.reduce((summary, user) => {
      summary[user.role] = (summary[user.role] || 0) + 1;
      return summary;
    }, {});

    return {
      usersByRole,
      incidents,
      featureFlags: featureFlagService.list()
    };
  }
});

module.exports = {
  createAnalyticsService
};
