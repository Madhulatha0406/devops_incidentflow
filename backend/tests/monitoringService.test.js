const { EventEmitter } = require("events");
const client = require("prom-client");
const { createMonitoringService } = require("../src/services/monitoringService");

const createMockResponse = (statusCode = 200) => {
  const response = new EventEmitter();
  response.statusCode = statusCode;
  response.headers = {};
  response.write = jest.fn(() => true);
  response.end = jest.fn(() => true);
  response.set = jest.fn((name, value) => {
    response.headers[name] = value;
  });
  response.send = jest.fn();
  return response;
};

describe("monitoringService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("captures request, response, and error metrics from middleware", async () => {
    const service = createMonitoringService({
      activeColor: "blue",
      nodeEnv: "test",
      featureFlags: {
        incidents: true
      }
    });
    const middleware = service.createRequestMetricsMiddleware();
    const request = {
      method: "POST",
      path: "/api/incidents",
      originalUrl: "/api/incidents?debug=true",
      baseUrl: "",
      body: {
        title: "Lab router down"
      },
      headers: {}
    };
    const response = createMockResponse(503);

    middleware(request, response, () => {});
    response.write(JSON.stringify({ error: "module disabled" }));
    response.end();
    response.emit("finish");

    const metrics = await service.metrics();
    expect(metrics).toContain("incidentflow_http_request_size_bytes");
    expect(metrics).toContain("incidentflow_http_response_size_bytes");
    expect(metrics).toContain("incidentflow_http_errors_total");
    expect(metrics).toContain('route="/api/incidents"');
  });

  test("skips self-scrape recursion for /metrics and serves registry output", async () => {
    const service = createMonitoringService({
      activeColor: "green",
      nodeEnv: "test",
      featureFlags: {
        incidents: true
      }
    });
    const middleware = service.createRequestMetricsMiddleware();
    const request = {
      method: "GET",
      path: "/metrics",
      originalUrl: "/metrics",
      baseUrl: "",
      headers: {}
    };
    const response = createMockResponse(200);
    const next = jest.fn();

    middleware(request, response, next);
    expect(next).toHaveBeenCalled();

    await service.handleMetrics({}, response);
    expect(response.set).toHaveBeenCalledWith("Content-Type", service.contentType);
    expect(response.send).toHaveBeenCalled();
  });

  test("handles request size fallbacks, route normalization, and typed response chunks", async () => {
    const defaultMetricsSpy = jest.spyOn(client, "collectDefaultMetrics").mockImplementation(() => {});
    const service = createMonitoringService({
      activeColor: "green",
      nodeEnv: "production",
      featureFlags: {
        incidents: true
      }
    });
    expect(defaultMetricsSpy).toHaveBeenCalled();

    const middleware = service.createRequestMetricsMiddleware();
    const circularBody = {};
    circularBody.self = circularBody;

    const cases = [
      {
        request: {
          method: "POST",
          path: "/api/incidents",
          originalUrl: "/api/incidents?id=1",
          baseUrl: "/api",
          route: { path: "/incidents" },
          body: Buffer.from("abc"),
          headers: {}
        },
        responseChunks: [Buffer.from("ok")]
      },
      {
        request: {
          method: "PUT",
          path: "/api/incidents/1",
          originalUrl: "/api/incidents/1",
          baseUrl: "/api/incidents",
          route: { path: "/:id" },
          body: "payload-text",
          headers: {}
        },
        responseChunks: [new Uint8Array([1, 2, 3])]
      },
      {
        request: {
          method: "GET",
          path: "/health",
          originalUrl: "/health",
          baseUrl: "",
          body: null,
          headers: {
            "content-length": "42"
          }
        },
        responseChunks: [new ArrayBuffer(8)]
      },
      {
        request: {
          method: "PATCH",
          path: undefined,
          originalUrl: undefined,
          baseUrl: "",
          body: circularBody,
          headers: {}
        },
        responseChunks: [12345, null]
      }
    ];

    cases.forEach(({ request, responseChunks }) => {
      const response = createMockResponse(200);
      middleware(request, response, () => {});
      responseChunks.forEach((chunk) => {
        response.write(chunk);
      });
      response.end();
      response.emit("finish");
    });

    const metrics = await service.metrics();
    expect(metrics).toContain("incidentflow_http_request_size_bytes");
    expect(metrics).toContain('route="/api/incidents/:id"');
    expect(metrics).toContain('route="unknown"');
  });
});
