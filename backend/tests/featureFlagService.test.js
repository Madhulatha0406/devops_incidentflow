const { createFeatureFlagService } = require("../src/services/featureFlagService");

describe("featureFlagService", () => {
  test("lists and updates flags", () => {
    const service = createFeatureFlagService({
      incidents: true
    });

    expect(service.list().incidents).toBe(true);
    expect(service.setFlag("incidents", false)).toEqual({
      name: "incidents",
      enabled: false
    });
    expect(service.isEnabled("incidents")).toBe(false);
  });

  test("reset restores defaults", () => {
    const service = createFeatureFlagService({
      incidents: true
    });
    service.setFlag("incidents", false);
    expect(service.reset()).toEqual({ incidents: true });
  });
});
