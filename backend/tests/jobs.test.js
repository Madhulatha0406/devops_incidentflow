const { createBusTrackerJob } = require("../src/jobs/busTracker");
const { createEscalationMonitorJob } = require("../src/jobs/escalationMonitor");
const { createMockLogger } = require("./helpers");

describe("background jobs", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("bus tracker tick emits updates", async () => {
    const io = { emit: jest.fn() };
    const job = createBusTrackerJob({
      busService: {
        advanceSimulation: jest.fn().mockResolvedValue([{ busId: "BUS-1" }]),
        getDelayAlerts: jest.fn().mockResolvedValue([{ busId: "BUS-1" }])
      },
      io,
      intervalMs: 1000,
      logger: createMockLogger()
    });

    const result = await job.tick();
    expect(result.buses).toHaveLength(1);
    expect(io.emit).toHaveBeenCalledTimes(2);
  });

  test("escalation job starts and stops", () => {
    jest.useFakeTimers();
    const job = createEscalationMonitorJob({
      incidentService: {
        runEscalationScan: jest.fn().mockResolvedValue([])
      },
      intervalMs: 1000,
      logger: createMockLogger()
    });

    const timer = job.start();
    expect(timer).toBeTruthy();
    job.stop();
  });
});
