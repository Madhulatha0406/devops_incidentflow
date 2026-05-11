const normalizeConfiguredOrigins = (configuredOrigin) => {
  if (!configuredOrigin) {
    return [];
  }

  return String(configuredOrigin)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

const createCorsOriginValidator = (configuredOrigin) => {
  const allowedOrigins = normalizeConfiguredOrigins(configuredOrigin);

  if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
    return (_origin, callback) => callback(null, true);
  }

  return (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  };
};

module.exports = {
  createCorsOriginValidator,
  normalizeConfiguredOrigins
};
