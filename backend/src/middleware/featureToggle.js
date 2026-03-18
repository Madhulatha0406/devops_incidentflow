const { AppError } = require("../utils/appError");

const requireFeature = (featureFlagService, name) => (_req, _res, next) => {
  if (!featureFlagService.isEnabled(name)) {
    next(new AppError(`${name} module is currently disabled`, 503, { feature: name }));
    return;
  }

  next();
};

module.exports = {
  requireFeature
};
