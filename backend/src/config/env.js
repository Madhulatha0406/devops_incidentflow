const fs = require("fs");
const path = require("path");

const loadEnvFiles = ({ processObject = process, fsModule = fs, pathModule = path } = {}) => {
  if (typeof processObject.loadEnvFile !== "function") {
    return [];
  }

  const loadedFiles = [];
  const candidatePaths = [
    pathModule.resolve(__dirname, "../../../.env"),
    pathModule.resolve(__dirname, "../../.env")
  ];

  candidatePaths.forEach((candidatePath) => {
    if (!fsModule.existsSync(candidatePath)) {
      return;
    }

    processObject.loadEnvFile(candidatePath);
    loadedFiles.push(candidatePath);
  });

  return loadedFiles;
};

loadEnvFiles();

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/incidentflow",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  logLevel: process.env.LOG_LEVEL || "info",
  useInMemoryDb: toBoolean(process.env.USE_IN_MEMORY_DB, false),
  busUpdateIntervalMs: toNumber(process.env.BUS_UPDATE_INTERVAL_MS, 5000),
  activeColor: process.env.ACTIVE_COLOR || "blue",
  aiProvider: process.env.AI_PROVIDER || "local",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  featureFlags: {
    incidents: toBoolean(process.env.FEATURE_INCIDENTS, true),
    busTracking: toBoolean(process.env.FEATURE_BUS_TRACKING, true),
    aiCorrection: toBoolean(process.env.FEATURE_AI_CORRECTION, true)
  },
  slaHours: {
    low: toNumber(process.env.SLA_LOW_HOURS, 24),
    medium: toNumber(process.env.SLA_MEDIUM_HOURS, 12),
    high: toNumber(process.env.SLA_HIGH_HOURS, 4),
    critical: toNumber(process.env.SLA_CRITICAL_HOURS, 1)
  }
};

module.exports = {
  env,
  loadEnvFiles,
  toBoolean,
  toNumber
};
