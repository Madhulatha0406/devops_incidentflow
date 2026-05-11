const { createEscalationMonitorJob } = require("../src/jobs/escalationMonitor");
const { createMockLogger } = require("./helpers");

describe("background jobs", () => {
  afterEach(() => {
    jest.useRealTimers();
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

  test("escalation job tick returns the escalated incidents", async () => {
    const job = createEscalationMonitorJob({
      incidentService: {
        runEscalationScan: jest.fn().mockResolvedValue([{ _id: "inc-1" }])
      },
      intervalMs: 1000,
      logger: createMockLogger()
    });

    await expect(job.tick()).resolves.toEqual([{ _id: "inc-1" }]);
  });
});
