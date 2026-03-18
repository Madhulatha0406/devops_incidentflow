const express = require("express");
const { createAuthRoutes } = require("./authRoutes");
const { createIncidentRoutes } = require("./incidentRoutes");
const { createBusRoutes } = require("./busRoutes");
const { createAIRoutes } = require("./aiRoutes");
const { createAdminRoutes } = require("./adminRoutes");
const { createHealthRoutes } = require("./healthRoutes");
const { createAuthenticate, authorize } = require("../middleware/auth");
const { requireFeature } = require("../middleware/featureToggle");

const createRouter = ({ controllers, services, env }) => {
  const router = express.Router();
  const authenticate = createAuthenticate({
    authService: services.authService,
    jwtSecret: env.jwtSecret
  });

  router.use("/health", createHealthRoutes(controllers.healthController));
  router.use("/auth", createAuthRoutes(controllers.authController));
  router.use(
    "/incidents",
    createIncidentRoutes({
      controller: controllers.incidentController,
      authenticate,
      authorize,
      requireFeature: requireFeature(services.featureFlagService, "incidents")
    })
  );
  router.use(
    "/buses",
    createBusRoutes({
      controller: controllers.busController,
      authenticate,
      requireFeature: requireFeature(services.featureFlagService, "busTracking")
    })
  );
  router.use(
    "/ai",
    createAIRoutes({
      controller: controllers.aiController,
      authenticate,
      requireFeature: requireFeature(services.featureFlagService, "aiCorrection")
    })
  );
  router.use(
    "/admin",
    createAdminRoutes({
      controller: controllers.adminController,
      authenticate,
      authorize
    })
  );

  return router;
};

module.exports = {
  createRouter
};
