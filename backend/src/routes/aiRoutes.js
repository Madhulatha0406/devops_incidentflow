const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");

const createAIRoutes = ({ controller, authenticate, requireFeature }) => {
  const router = express.Router();

  router.use(authenticate);
  router.use(requireFeature);
  router.post("/correct", asyncHandler(controller.analyzeAnswer));

  return router;
};

module.exports = {
  createAIRoutes
};
