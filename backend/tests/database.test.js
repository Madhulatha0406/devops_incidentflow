const { connectDatabase, disconnectDatabase } = require("../src/config/database");
const { createMockLogger } = require("./helpers");

describe("database config", () => {
  test("skips connection in memory mode", async () => {
    const result = await connectDatabase({
      uri: "mongodb://localhost/test",
      useInMemoryDb: true,
      logger: createMockLogger()
    });

    expect(result).toEqual({ connected: false, mode: "memory" });
  });

  test("uses provided mongoose instance when connecting and disconnecting", async () => {
    const mongooseInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined)
    };
    const logger = createMockLogger();

    await connectDatabase({
      uri: "mongodb://localhost/test",
      useInMemoryDb: false,
      logger,
      mongooseInstance
    });
    await disconnectDatabase({
      useInMemoryDb: false,
      logger,
      mongooseInstance
    });

    expect(mongooseInstance.connect).toHaveBeenCalledWith("mongodb://localhost/test");
    expect(mongooseInstance.disconnect).toHaveBeenCalled();
  });
});
