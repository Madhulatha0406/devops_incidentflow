const mongoose = require("mongoose");

const connectDatabase = async ({ uri, useInMemoryDb, logger, mongooseInstance = mongoose }) => {
  if (useInMemoryDb) {
    logger.info("Using in-memory repositories; skipping MongoDB connection");
    return { connected: false, mode: "memory" };
  }

  await mongooseInstance.connect(uri);
  logger.info("MongoDB connection established");
  return { connected: true, mode: "mongo" };
};

const disconnectDatabase = async ({ useInMemoryDb, logger, mongooseInstance = mongoose }) => {
  if (useInMemoryDb) {
    logger.info("In-memory mode active; no MongoDB disconnect required");
    return;
  }

  await mongooseInstance.disconnect();
  logger.info("MongoDB connection closed");
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};
