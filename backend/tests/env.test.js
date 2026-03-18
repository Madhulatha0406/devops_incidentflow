const { env, toBoolean, toNumber } = require("../src/config/env");

describe("env config helpers", () => {
  test("toBoolean returns fallback for empty values", () => {
    expect(toBoolean(undefined, true)).toBe(true);
    expect(toBoolean("", false)).toBe(false);
  });

  test("toBoolean parses truthy strings", () => {
    expect(toBoolean("true")).toBe(true);
    expect(toBoolean("YES")).toBe(true);
    expect(toBoolean("off", true)).toBe(false);
  });

  test("toNumber returns fallback for invalid numbers", () => {
    expect(toNumber("24", 5)).toBe(24);
    expect(toNumber("x", 5)).toBe(5);
  });

  test("env exposes feature flags and SLA config", () => {
    expect(env.featureFlags).toHaveProperty("incidents");
    expect(env.slaHours).toHaveProperty("critical");
  });
});
