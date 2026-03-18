const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");

const createIncidentRoutes = ({ controller, authenticate, authorize, requireFeature }) => {
  const router = express.Router();

  router.use(authenticate);
  router.use(requireFeature);
  router.get("/", asyncHandler(controller.listIncidents));
  router.post("/", authorize("student", "admin"), asyncHandler(controller.reportIncident));
  router.patch("/:id/assign", authorize("admin"), asyncHandler(controller.assignTechnician));
  router.patch("/:id/status", authorize("technician", "admin"), asyncHandler(controller.updateStatus));

  return router;
};

module.exports = {
  createIncidentRoutes
};
