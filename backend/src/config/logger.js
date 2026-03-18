const levelOrder = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const createLogger = (level = "info", context = {}) => {
  const activeLevel = levelOrder[level] ?? levelOrder.info;

  const shouldLog = (messageLevel) => (levelOrder[messageLevel] ?? levelOrder.info) <= activeLevel;

  const write = (messageLevel, message, meta = {}) => {
    if (!shouldLog(messageLevel)) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level: messageLevel,
      message,
      ...context,
      ...meta
    };

    const text = JSON.stringify(payload);

    if (messageLevel === "error") {
      console.error(text);
      return;
    }

    if (messageLevel === "warn") {
      console.warn(text);
      return;
    }

    console.log(text);
  };

  return {
    info: (message, meta) => write("info", message, meta),
    warn: (message, meta) => write("warn", message, meta),
    error: (message, meta) => write("error", message, meta),
    debug: (message, meta) => write("debug", message, meta),
    child: (childContext = {}) => createLogger(level, { ...context, ...childContext })
  };
};

module.exports = {
  createLogger
};
