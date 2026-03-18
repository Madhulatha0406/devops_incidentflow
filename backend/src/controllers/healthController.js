const createHealthController = ({ featureFlagService, repositories, activeColor }) => ({
  getHealth: async (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      databaseMode: repositories.mode,
      activeColor,
      featureFlags: featureFlagService.list()
    });
  }
});

module.exports = {
  createHealthController
};
