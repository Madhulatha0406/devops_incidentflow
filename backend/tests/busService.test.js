const { DEFAULT_BUSES, advanceBus, asNumber, clamp, createBusService } = require("../src/services/busService");
const { createRepositories } = require("../src/repositories/createRepositories");

describe("busService", () => {
  test("clamp limits values", () => {
    expect(clamp(20, 0, 10)).toBe(10);
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  test("asNumber returns fallback for invalid values", () => {
    expect(asNumber(undefined, 10)).toBe(10);
    expect(asNumber("15", 10)).toBe(15);
  });

  test("advanceBus updates coordinates and status", () => {
    const updated = advanceBus(DEFAULT_BUSES[0], new Date("2026-01-01T00:00:00.000Z"));
    expect(updated.lat).not.toBe(DEFAULT_BUSES[0].lat);
    expect(updated.lastUpdated).toBe("2026-01-01T00:00:00.000Z");
  });

  test("advanceBus uses safe defaults when direction is missing", () => {
    const updated = advanceBus(
      {
        ...DEFAULT_BUSES[0],
        direction: undefined
      },
      new Date("2026-01-01T00:00:00.000Z")
    );

    expect(updated.direction).toBe(1);
    expect(Number.isFinite(updated.lat)).toBe(true);
  });

  test("bootstraps buses and returns alerts", async () => {
    const repositories = createRepositories({
      useInMemoryDb: true,
      defaultUsers: []
    });
    const service = createBusService({
      repositories,
      nowProvider: () => new Date("2026-01-01T00:00:00.000Z")
    });

    await service.bootstrap();
    await repositories.buses.saveAll([
      {
        ...DEFAULT_BUSES[0],
        delayMinutes: 8,
        lastUpdated: "2026-01-01T00:00:00.000Z"
      }
    ]);

    const alerts = await service.getDelayAlerts();
    expect(alerts[0].message).toContain("delayed");
  });
});
