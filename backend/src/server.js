const { env } = require("./config/env");
const { createRuntime } = require("./bootstrap");

const bootstrap = async () => {
  const runtime = await createRuntime();

  runtime.busTrackerJob.start();
  runtime.escalationMonitorJob.start();

  runtime.server.listen(env.port, () => {
    runtime.logger.info("IncidentFlow+ backend started", {
      port: env.port,
      activeColor: env.activeColor
    });
  });
};

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
