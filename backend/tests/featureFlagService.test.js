const { createFeatureFlagService } = require("../src/services/featureFlagService");

describe("featureFlagService", () => {
  test("lists and updates flags", () => {
    const service = createFeatureFlagService({
      incidents: true,
      busTracking: true,
      aiCorrection: false
    });

    expect(service.list().aiCorrection).toBe(false);
    expect(service.setFlag("aiCorrection", true)).toEqual({
      name: "aiCorrection",
      enabled: true
    });
    expect(service.isEnabled("aiCorrection")).toBe(true);
  });

  test("reset restores defaults", () => {
    const service = createFeatureFlagService({
      incidents: true
    });
    service.setFlag("incidents", false);
    expect(service.reset()).toEqual({ incidents: true });
  });
});
