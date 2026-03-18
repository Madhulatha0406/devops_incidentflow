const createBusController = ({ busService }) => ({
  listBuses: async (_req, res) => {
    const buses = await busService.getBuses();
    const alerts = await busService.getDelayAlerts();
    res.json({ buses, alerts });
  }
});

module.exports = {
  createBusController
};
