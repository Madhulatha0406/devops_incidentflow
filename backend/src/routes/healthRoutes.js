const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");

const createHealthRoutes = (controller) => {
  const router = express.Router();

  router.get("/", asyncHandler(controller.getHealth));

  return router;
};

module.exports = {
  createHealthRoutes
};
