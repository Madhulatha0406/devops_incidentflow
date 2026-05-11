const client = require("prom-client");

const normalizeRoute = (req) => {
  if (req.route?.path) {
    const routePath = req.route.path === "/" ? "" : req.route.path;
    return `${req.baseUrl || ""}${routePath}` || req.route.path;
  }

  return req.originalUrl?.split("?")[0] || req.path || "unknown";
};

const getStatusFamily = (statusCode) => `${Math.floor(Number(statusCode || 0) / 100)}xx`;

const getHeaderSizeBytes = (value) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const getRequestSizeBytes = (req) => {
  const headerSize = getHeaderSizeBytes(req.headers["content-length"]);
  if (headerSize !== null) {
    return headerSize;
  }

  if (req.body == null) {
    return 0;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.length;
  }

  if (typeof req.body === "string") {
    return Buffer.byteLength(req.body);
  }

  try {
    return Buffer.byteLength(JSON.stringify(req.body));
  } catch {
    return 0;
  }
};

const getChunkSizeBytes = (chunk, encoding) => {
  if (chunk == null) {
    return 0;
  }

  if (Buffer.isBuffer(chunk)) {
    return chunk.length;
  }

  if (typeof chunk === "string") {
    return Buffer.byteLength(chunk, encoding);
  }

  if (ArrayBuffer.isView(chunk)) {
    return chunk.byteLength;
  }

  if (chunk instanceof ArrayBuffer) {
    return chunk.byteLength;
  }

  return 0;
};

const createMonitoringService = ({ activeColor = "blue", featureFlags = {}, nodeEnv = "development" } = {}) => {
  const registry = new client.Registry();

  registry.setDefaultLabels({
    app: "incidentflow-plus",
    active_color: activeColor,
    environment: nodeEnv
  });

  if (nodeEnv !== "test") {
    client.collectDefaultMetrics({
      prefix: "incidentflow_",
      register: registry
    });
  }

  const requestCounter = new client.Counter({
    name: "incidentflow_http_requests_total",
    help: "Total number of HTTP requests handled by IncidentFlow+.",
    labelNames: ["method", "route", "status_code"],
    registers: [registry]
  });

  const requestDuration = new client.Histogram({
    name: "incidentflow_http_request_duration_seconds",
    help: "HTTP request duration in seconds.",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry]
  });

  const requestSize = new client.Histogram({
    name: "incidentflow_http_request_size_bytes",
    help: "HTTP request body size in bytes.",
    labelNames: ["method", "route"],
    buckets: [0, 128, 512, 1024, 4096, 16384, 65536, 262144, 1048576],
    registers: [registry]
  });

  const responseSize = new client.Histogram({
    name: "incidentflow_http_response_size_bytes",
    help: "HTTP response body size in bytes.",
    labelNames: ["method", "route", "status_code"],
    buckets: [0, 128, 512, 1024, 4096, 16384, 65536, 262144, 1048576],
    registers: [registry]
  });

  const inFlightGauge = new client.Gauge({
    name: "incidentflow_http_requests_in_flight",
    help: "Number of HTTP requests currently in flight.",
    registers: [registry]
  });

  const errorCounter = new client.Counter({
    name: "incidentflow_http_errors_total",
    help: "Total number of HTTP requests that completed with an error status.",
    labelNames: ["method", "route", "status_code", "status_family"],
    registers: [registry]
  });

  const featureFlagGauge = new client.Gauge({
    name: "incidentflow_feature_flag_enabled",
    help: "Whether a feature flag is enabled (1) or disabled (0).",
    labelNames: ["flag"],
    registers: [registry]
  });

  const authAttemptCounter = new client.Counter({
    name: "incidentflow_auth_attempts_total",
    help: "Authentication attempts by action, outcome, and role.",
    labelNames: ["action", "outcome", "role"],
    registers: [registry]
  });

  const incidentEventCounter = new client.Counter({
    name: "incidentflow_incident_events_total",
    help: "Incident workflow events by action, priority, status, and actor role.",
    labelNames: ["action", "priority", "status", "actor_role"],
    registers: [registry]
  });

  const repositoryOperationCounter = new client.Counter({
    name: "incidentflow_repository_operations_total",
    help: "Repository operations executed by repository, operation, mode, and outcome.",
    labelNames: ["repository", "operation", "mode", "outcome"],
    registers: [registry]
  });

  const repositoryOperationDuration = new client.Histogram({
    name: "incidentflow_repository_operation_duration_seconds",
    help: "Repository operation duration in seconds.",
    labelNames: ["repository", "operation", "mode", "outcome"],
    buckets: [0.0005, 0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry]
  });

  const databaseConnectionGauge = new client.Gauge({
    name: "incidentflow_database_connected",
    help: "Database connectivity state for the current application runtime.",
    labelNames: ["mode"],
    registers: [registry]
  });

  const incidentTotalGauge = new client.Gauge({
    name: "incidentflow_incidents_total",
    help: "Total number of incidents currently tracked.",
    registers: [registry]
  });

  const incidentStatusGauge = new client.Gauge({
    name: "incidentflow_incidents_by_status",
    help: "Current incident count grouped by status.",
    labelNames: ["status"],
    registers: [registry]
  });

  const incidentBreachedGauge = new client.Gauge({
    name: "incidentflow_incidents_breached_total",
    help: "Current number of breached incidents.",
    registers: [registry]
  });

  const incidentEscalatedGauge = new client.Gauge({
    name: "incidentflow_incidents_escalated_total",
    help: "Current number of escalated incidents.",
    registers: [registry]
  });

  const buildInfoGauge = new client.Gauge({
    name: "incidentflow_build_info",
    help: "Build information for the running IncidentFlow+ instance.",
    labelNames: ["active_color", "node_env"],
    registers: [registry]
  });

  buildInfoGauge.set({ active_color: activeColor, node_env: nodeEnv }, 1);

  const updateFeatureFlags = (nextFlags = {}) => {
    Object.entries(nextFlags).forEach(([name, enabled]) => {
      featureFlagGauge.labels(name).set(enabled ? 1 : 0);
    });
  };

  const recordAuthAttempt = ({ action = "login", outcome = "success", role = "unknown" } = {}) => {
    authAttemptCounter.labels(action, outcome, role).inc();
  };

  const recordIncidentEvent = ({
    action = "updated",
    priority = "unknown",
    status = "unknown",
    actorRole = "unknown"
  } = {}) => {
    incidentEventCounter.labels(action, priority, status, actorRole).inc();
  };

  const observeRepositoryOperation = ({
    repository = "unknown",
    operation = "unknown",
    mode = "unknown",
    outcome = "success",
    durationSeconds = 0
  } = {}) => {
    repositoryOperationCounter.labels(repository, operation, mode, outcome).inc();
    repositoryOperationDuration.labels(repository, operation, mode, outcome).observe(durationSeconds);
  };

  const setDatabaseConnectionState = ({ mode = "unknown", connected = false } = {}) => {
    databaseConnectionGauge.labels(mode).set(connected ? 1 : 0);
  };

  const updateIncidentSnapshot = (summary = {}) => {
    incidentTotalGauge.set(summary.total || 0);
    incidentBreachedGauge.set(summary.breached || 0);
    incidentEscalatedGauge.set(summary.escalated || 0);
    incidentStatusGauge.reset();
    Object.entries(summary.byStatus || {}).forEach(([status, count]) => {
      incidentStatusGauge.labels(status).set(count);
    });
  };

  updateFeatureFlags(featureFlags);

  return {
    createRequestMetricsMiddleware: () => (req, res, next) => {
      if (req.path === "/metrics") {
        next();
        return;
      }

      const startedAt = process.hrtime.bigint();
      const requestSizeBytes = getRequestSizeBytes(req);
      let responseSizeBytes = 0;
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);

      res.write = (chunk, encoding, callback) => {
        responseSizeBytes += getChunkSizeBytes(chunk, encoding);
        return originalWrite(chunk, encoding, callback);
      };

      res.end = (chunk, encoding, callback) => {
        responseSizeBytes += getChunkSizeBytes(chunk, encoding);
        return originalEnd(chunk, encoding, callback);
      };

      inFlightGauge.inc();

      res.on("finish", () => {
        const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
        const labels = {
          method: req.method,
          route: normalizeRoute(req),
          status_code: String(res.statusCode)
        };

        requestCounter.labels(labels.method, labels.route, labels.status_code).inc();
        requestDuration.labels(labels.method, labels.route, labels.status_code).observe(durationSeconds);
        requestSize.labels(labels.method, labels.route).observe(requestSizeBytes);
        responseSize.labels(labels.method, labels.route, labels.status_code).observe(responseSizeBytes);
        if (res.statusCode >= 400) {
          errorCounter.labels(labels.method, labels.route, labels.status_code, getStatusFamily(res.statusCode)).inc();
        }
        inFlightGauge.dec();
      });

      next();
    },
    handleMetrics: async (_req, res) => {
      res.set("Content-Type", registry.contentType);
      res.send(await registry.metrics());
    },
    metrics: async () => registry.metrics(),
    updateFeatureFlags,
    updateIncidentSnapshot,
    recordAuthAttempt,
    recordIncidentEvent,
    observeRepositoryOperation,
    setDatabaseConnectionState,
    contentType: registry.contentType
  };
};

module.exports = {
  createMonitoringService
};
