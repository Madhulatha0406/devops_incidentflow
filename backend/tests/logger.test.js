const { createLogger } = require("../src/config/logger");

describe("logger", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("logs info with JSON payload", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger("info", { service: "test" });
    logger.info("hello", { requestId: "1" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("\"message\":\"hello\""));
  });

  test("suppresses debug below active log level", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger("info");
    logger.debug("hidden");
    expect(spy).not.toHaveBeenCalled();
  });

  test("child logger keeps context", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger("info", { service: "root" }).child({ requestId: "2" });
    logger.info("child");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("\"requestId\":\"2\""));
  });
});
