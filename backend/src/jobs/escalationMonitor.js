const createEscalationMonitorJob = ({ incidentService, intervalMs, logger }) => {
  let timer = null;

  const tick = async () => {
    const escalated = await incidentService.runEscalationScan();
    logger.debug("Escalation scan completed", { escalated: escalated.length });
    return escalated;
  };

  return {
    start: () => {
      if (!timer) {
        timer = setInterval(() => {
          tick().catch((error) => logger.error("Escalation monitor failed", { message: error.message }));
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
  createEscalationMonitorJob
};
