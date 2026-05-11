const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createRequestLogger } = require("./middleware/requestLogger");
const { createErrorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { createRouter } = require("./routes");

const createApp = ({ env, logger, controllers, services }) => {
  const app = express();
  const monitoringService = services.monitoringService;

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin
    })
  );
  app.use(express.json());
  app.use(createRequestLogger(logger));
  if (monitoringService) {
    app.use(monitoringService.createRequestMetricsMiddleware());
    app.get("/metrics", monitoringService.handleMetrics);
  }
  app.use("/health", controllers.healthController.getHealth);
  app.use("/api", createRouter({ controllers, services, env }));
  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
};

module.exports = {
  createApp
};
