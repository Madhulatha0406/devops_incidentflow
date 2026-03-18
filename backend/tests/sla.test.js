const { buildEscalationState, calculateSlaDueAt, getPriorityHours, isBreached } = require("../src/utils/sla");

describe("sla utilities", () => {
  const hours = { low: 24, medium: 12, high: 4, critical: 1 };

  test("returns configured priority hours", () => {
    expect(getPriorityHours("critical", hours)).toBe(1);
    expect(getPriorityHours("unknown", hours)).toBe(24);
  });

  test("calculates SLA due date", () => {
    expect(calculateSlaDueAt("2026-01-01T00:00:00.000Z", "high", hours).toISOString()).toBe(
      "2026-01-01T04:00:00.000Z"
    );
  });

  test("detects breached incidents", () => {
    const incident = {
      status: "open",
      slaDueAt: "2026-01-01T01:00:00.000Z"
    };
    expect(isBreached(incident, "2026-01-01T02:00:00.000Z")).toBe(true);
  });

  test("builds escalation state when breached", () => {
    const state = buildEscalationState(
      {
        _id: "inc-1",
        title: "WiFi outage",
        status: "open",
        slaDueAt: "2026-01-01T01:00:00.000Z",
        escalationLevel: 1
      },
      "2026-01-01T03:00:00.000Z"
    );

    expect(state.breached).toBe(true);
    expect(state.escalationLevel).toBe(2);
  });
});
