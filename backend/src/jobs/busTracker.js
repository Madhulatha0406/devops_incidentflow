const createBusTrackerJob = ({ busService, io, intervalMs, logger }) => {
  let timer = null;

  const tick = async () => {
    const buses = await busService.advanceSimulation();
    const alerts = await busService.getDelayAlerts();
    if (io) {
      io.emit("buses:update", buses);
      io.emit("buses:alerts", alerts);
    }
    logger.debug("Bus simulation tick completed", { buses: buses.length, alerts: alerts.length });
    return { buses, alerts };
  };

  return {
    start: () => {
      if (!timer) {
        timer = setInterval(() => {
          tick().catch((error) => logger.error("Bus tracker job failed", { message: error.message }));
        }, intervalMs);
      }
      return timer;
    },
    stop: () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    tick
  };
};

module.exports = {
  createBusTrackerJob
};
