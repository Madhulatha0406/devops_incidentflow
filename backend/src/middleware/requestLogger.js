const createRequestLogger = (logger) => (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    });
  });

  next();
};

module.exports = {
  createRequestLogger
};
