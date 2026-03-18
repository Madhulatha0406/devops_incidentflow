const { AppError } = require("../utils/appError");

const createFeatureFlagService = (initialFlags) => {
  let flags = { ...initialFlags };

  return {
    list: () => ({ ...flags }),
    isEnabled: (name) => Boolean(flags[name]),
    setFlag: (name, enabled) => {
      if (!(name in flags)) {
        throw new AppError(`Unknown feature flag: ${name}`, 404);
      }

      flags[name] = Boolean(enabled);
      return { name, enabled: flags[name] };
    },
    reset: () => {
      flags = { ...initialFlags };
      return { ...flags };
    }
  };
};

module.exports = {
  createFeatureFlagService
};
