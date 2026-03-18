const http = require("http");
const { env: loadedEnv } = require("./config/env");
const { createLogger } = require("./config/logger");
const { connectDatabase } = require("./config/database");
const { createSocketServer } = require("./config/socket");
const { defaultUsers } = require("./config/defaultUsers");
const { createRepositories } = require("./repositories/createRepositories");
const { createFeatureFlagService } = require("./services/featureFlagService");
const { createAuthService } = require("./services/authService");
const { createIncidentService } = require("./services/incidentService");
const { createBusService } = require("./services/busService");
const { createAICorrectionService } = require("./services/aiCorrectionService");
const { createAnalyticsService } = require("./services/analyticsService");
const { createAuthController } = require("./controllers/authController");
const { createIncidentController } = require("./controllers/incidentController");
const { createBusController } = require("./controllers/busController");
const { createAIController } = require("./controllers/aiController");
const { createAdminController } = require("./controllers/adminController");
const { createHealthController } = require("./controllers/healthController");
const { createBusTrackerJob } = require("./jobs/busTracker");
const { createEscalationMonitorJob } = require("./jobs/escalationMonitor");
const { createApp } = require("./app");

const createApplicationContext = async (overrides = {}) => {
  const env = {
    ...loadedEnv,
    ...overrides.env,
    featureFlags: {
      ...loadedEnv.featureFlags,
      ...(overrides.env?.featureFlags || {})
    },
    slaHours: {
      ...loadedEnv.slaHours,
      ...(overrides.env?.slaHours || {})
    }
  };
  const logger = overrides.logger || createLogger(env.logLevel);

  await connectDatabase({
    uri: env.mongoUri,
    useInMemoryDb: env.useInMemoryDb,
    logger,
    mongooseInstance: overrides.mongooseInstance
  });

  const repositories =
    overrides.repositories ||
    createRepositories({
      useInMemoryDb: env.useInMemoryDb,
      defaultUsers
    });

  const featureFlagService = createFeatureFlagService(env.featureFlags);
  const authService = createAuthService({
    repositories,
    jwtSecret: env.jwtSecret,
    jwtExpiresIn: env.jwtExpiresIn
  });
  const incidentService = createIncidentService({
    repositories,
    slaHours: env.slaHours,
    nowProvider: overrides.nowProvider
  });
  const busService = createBusService({
    repositories,
    nowProvider: overrides.nowProvider
  });
  const aiCorrectionService = createAICorrectionService({
    provider: env.aiProvider
  });
  const analyticsService = createAnalyticsService({
    authService,
    incidentService,
    busService,
    featureFlagService
  });

  await authService.seedDefaultUsers(defaultUsers);
  await busService.bootstrap();

  const controllers = {
    authController: createAuthController({ authService }),
    incidentController: createIncidentController({ incidentService }),
    busController: createBusController({ busService }),
    aiController: createAIController({ aiCorrectionService }),
    adminController: createAdminController({
      analyticsService,
      authService,
      featureFlagService,
      incidentService
    }),
    healthController: createHealthController({
      featureFlagService,
      repositories,
      activeColor: env.activeColor
    })
  };

  const services = {
    authService,
    incidentService,
    busService,
    aiCorrectionService,
    analyticsService,
    featureFlagService
  };

  const app = createApp({
    env,
    logger,
    controllers,
    services
  });

  return {
    env,
    logger,
    repositories,
    services,
    controllers,
    app
  };
};

const createRuntime = async (overrides = {}) => {
  const context = await createApplicationContext(overrides);
  const server = http.createServer(context.app);
  const io = createSocketServer(server, context.env.clientOrigin);
  const busTrackerJob = createBusTrackerJob({
    busService: context.services.busService,
    io,
    intervalMs: context.env.busUpdateIntervalMs,
    logger: context.logger
  });
  const escalationMonitorJob = createEscalationMonitorJob({
    incidentService: context.services.incidentService,
    intervalMs: context.env.busUpdateIntervalMs,
    logger: context.logger
  });

  return {
    ...context,
    io,
    server,
    busTrackerJob,
    escalationMonitorJob
  };
};

module.exports = {
  createApplicationContext,
  createRuntime
};
