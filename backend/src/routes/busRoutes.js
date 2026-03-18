const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");

const createBusRoutes = ({ controller, authenticate, requireFeature }) => {
  const router = express.Router();

  router.use(authenticate);
  router.use(requireFeature);
  router.get("/", asyncHandler(controller.listBuses));

  return router;
};

module.exports = {
  createBusRoutes
};
