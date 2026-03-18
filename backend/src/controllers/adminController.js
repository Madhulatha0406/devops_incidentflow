const createAdminController = ({ analyticsService, authService, featureFlagService, incidentService }) => ({
  getDashboard: async (_req, res) => {
    const dashboard = await analyticsService.getDashboard();
    res.json({ dashboard });
  },
  listUsers: async (_req, res) => {
    const users = await authService.listUsers();
    res.json({ users });
  },
  createUser: async (req, res) => {
    const user = await authService.createUser(req.body);
    res.status(201).json({
      message: "User created successfully",
      user
    });
  },
  listFeatureFlags: async (_req, res) => {
    res.json({ featureFlags: featureFlagService.list() });
  },
  updateFeatureFlag: async (req, res) => {
    const result = featureFlagService.setFlag(req.params.name, req.body.enabled);
    res.json({
      message: "Feature flag updated successfully",
      featureFlag: result
    });
  },
  runEscalationScan: async (_req, res) => {
    const escalated = await incidentService.runEscalationScan();
    res.json({
      message: "Escalation scan completed",
      escalated
    });
  }
});

module.exports = {
  createAdminController
};
