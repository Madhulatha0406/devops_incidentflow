const { AppError } = require("../utils/appError");

const notFoundHandler = (_req, _res, next) => {
  next(new AppError("Route not found", 404));
};

const createErrorHandler = (logger) => (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  logger.error("Request failed", {
    statusCode,
    message: error.message,
    details: error.details || {}
  });

  res.status(statusCode).json({
    error: error.message || "Internal server error",
    details: error.details || {}
  });
};

module.exports = {
  notFoundHandler,
  createErrorHandler
};
