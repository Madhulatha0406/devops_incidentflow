const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");

const createAdminRoutes = ({ controller, authenticate, authorize }) => {
  const router = express.Router();

  router.use(authenticate);
  router.use(authorize("admin"));
  router.get("/dashboard", asyncHandler(controller.getDashboard));
  router.get("/users", asyncHandler(controller.listUsers));
  router.post("/users", asyncHandler(controller.createUser));
  router.get("/feature-flags", asyncHandler(controller.listFeatureFlags));
  router.patch("/feature-flags/:name", asyncHandler(controller.updateFeatureFlag));
  router.post("/escalations/run", asyncHandler(controller.runEscalationScan));

  return router;
};

module.exports = {
  createAdminRoutes
};
