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
const { createAnalyticsService } = require("./services/analyticsService");
const { createMonitoringService } = require("./services/monitoringService");
const { createAuthController } = require("./controllers/authController");
const { createIncidentController } = require("./controllers/incidentController");
const { createAdminController } = require("./controllers/adminController");
const { createHealthController } = require("./controllers/healthController");
const { createEscalationMonitorJob } = require("./jobs/escalationMonitor");
const { createApp } = require("./app");

const instrumentRepositories = (repositories, monitoringService) => {
  if (!monitoringService) {
    return repositories;
  }

  return Object.entries(repositories).reduce((wrappedRepositories, [repositoryName, repositoryValue]) => {
    if (typeof repositoryValue !== "object" || repositoryValue === null || Array.isArray(repositoryValue)) {
      wrappedRepositories[repositoryName] = repositoryValue;
      return wrappedRepositories;
    }

    wrappedRepositories[repositoryName] = Object.entries(repositoryValue).reduce(
      (wrappedOperations, [operationName, operationValue]) => {
        if (typeof operationValue !== "function") {
          wrappedOperations[operationName] = operationValue;
          return wrappedOperations;
        }

        wrappedOperations[operationName] = async (...args) => {
          const startedAt = process.hrtime.bigint();
          try {
            const result = await operationValue(...args);
            monitoringService.observeRepositoryOperation({
              repository: repositoryName,
              operation: operationName,
              mode: repositories.mode,
              outcome: "success",
              durationSeconds: Number(process.hrtime.bigint() - startedAt) / 1e9
            });
            return result;
          } catch (error) {
            monitoringService.observeRepositoryOperation({
              repository: repositoryName,
              operation: operationName,
              mode: repositories.mode,
              outcome: "error",
              durationSeconds: Number(process.hrtime.bigint() - startedAt) / 1e9
            });
            throw error;
          }
        };

        return wrappedOperations;
      },
      {}
    );

    return wrappedRepositories;
  }, {});
};

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
  const monitoringService = createMonitoringService({
    activeColor: env.activeColor,
    featureFlags: env.featureFlags,
    nodeEnv: env.nodeEnv
  });

  const databaseMode = env.useInMemoryDb ? "memory" : "mongo";
  const connectionStartedAt = process.hrtime.bigint();
  try {
    await connectDatabase({
      uri: env.mongoUri,
      useInMemoryDb: env.useInMemoryDb,
      logger,
      mongooseInstance: overrides.mongooseInstance
    });
    monitoringService.setDatabaseConnectionState({
      mode: databaseMode,
      connected: !env.useInMemoryDb
    });
    monitoringService.observeRepositoryOperation({
      repository: "database",
      operation: "connect",
      mode: databaseMode,
      outcome: "success",
      durationSeconds: Number(process.hrtime.bigint() - connectionStartedAt) / 1e9
    });
  } catch (error) {
    monitoringService.setDatabaseConnectionState({
      mode: databaseMode,
      connected: false
    });
    monitoringService.observeRepositoryOperation({
      repository: "database",
      operation: "connect",
      mode: databaseMode,
      outcome: "error",
      durationSeconds: Number(process.hrtime.bigint() - connectionStartedAt) / 1e9
    });
    throw error;
  }

  const rawRepositories =
    overrides.repositories ||
    createRepositories({
      useInMemoryDb: env.useInMemoryDb,
      defaultUsers
    });
  const repositories = instrumentRepositories(rawRepositories, monitoringService);

  const featureFlagService = createFeatureFlagService(env.featureFlags);
  const authService = createAuthService({
    repositories,
    jwtSecret: env.jwtSecret,
    jwtExpiresIn: env.jwtExpiresIn,
    monitoringService
  });
  const incidentService = createIncidentService({
    repositories,
    slaHours: env.slaHours,
    nowProvider: overrides.nowProvider,
    monitoringService
  });
  const analyticsService = createAnalyticsService({
    authService,
    incidentService,
    featureFlagService
  });

  await authService.seedDefaultUsers(defaultUsers);
  monitoringService.updateIncidentSnapshot(await incidentService.getDashboardSummary());

  const controllers = {
    authController: createAuthController({ authService }),
    incidentController: createIncidentController({ incidentService }),
    adminController: createAdminController({
      analyticsService,
      authService,
      featureFlagService,
      incidentService,
      monitoringService
    }),
    healthController: createHealthController({
      featureFlagService,
      repositories,
      activeColor: env.activeColor,
      monitoringProvider: "prometheus",
      metricsPath: "/metrics"
    })
  };

  const services = {
    authService,
    incidentService,
    analyticsService,
    featureFlagService,
    monitoringService
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
  const escalationMonitorJob = createEscalationMonitorJob({
    incidentService: context.services.incidentService,
    intervalMs: context.env.escalationScanIntervalMs,
    logger: context.logger
  });

  return {
    ...context,
    io,
    server,
    escalationMonitorJob
  };
};

module.exports = {
  createApplicationContext,
  createRuntime
};
