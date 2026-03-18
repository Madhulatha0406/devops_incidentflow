const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");

const createAuthRoutes = (controller) => {
  const router = express.Router();

  router.post("/register", asyncHandler(controller.registerStudent));
  router.post("/login", asyncHandler(controller.login));

  return router;
};

module.exports = {
  createAuthRoutes
};
