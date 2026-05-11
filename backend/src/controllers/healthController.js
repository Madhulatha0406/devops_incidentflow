const createHealthController = ({
  featureFlagService,
  repositories,
  activeColor,
  monitoringProvider = null,
  metricsPath = null
}) => ({
  getHealth: async (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      databaseMode: repositories.mode,
      activeColor,
      featureFlags: featureFlagService.list(),
      monitoring:
        monitoringProvider && metricsPath
          ? {
              provider: monitoringProvider,
              metricsPath
            }
          : null
    });
  }
});

module.exports = {
  createHealthController
};
