const {
  createCorsOriginValidator,
  normalizeConfiguredOrigins
} = require("../src/utils/corsOrigin");

describe("corsOrigin utilities", () => {
  test("normalizes empty and comma-separated origin configuration", () => {
    expect(normalizeConfiguredOrigins("")).toEqual([]);
    expect(normalizeConfiguredOrigins(" https://a.example , https://b.example ")).toEqual([
      "https://a.example",
      "https://b.example"
    ]);
  });

  test("allows any origin when configuration is empty or wildcard", () => {
    const emptyValidator = createCorsOriginValidator("");
    const wildcardValidator = createCorsOriginValidator("*");
    const emptyCallback = jest.fn();
    const wildcardCallback = jest.fn();

    emptyValidator("https://frontend.example", emptyCallback);
    wildcardValidator("https://frontend.example", wildcardCallback);

    expect(emptyCallback).toHaveBeenCalledWith(null, true);
    expect(wildcardCallback).toHaveBeenCalledWith(null, true);
  });

  test("allows missing origin and explicitly configured origins", () => {
    const validator = createCorsOriginValidator("https://frontend.example,https://admin.example");
    const callbackWithoutOrigin = jest.fn();
    const callbackWithAllowedOrigin = jest.fn();

    validator(undefined, callbackWithoutOrigin);
    validator("https://admin.example", callbackWithAllowedOrigin);

    expect(callbackWithoutOrigin).toHaveBeenCalledWith(null, true);
    expect(callbackWithAllowedOrigin).toHaveBeenCalledWith(null, true);
  });

  test("rejects origins not in the allow-list", () => {
    const validator = createCorsOriginValidator("https://frontend.example");
    const callback = jest.fn();

    validator("https://malicious.example", callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(callback.mock.calls[0][0].message).toContain("https://malicious.example");
  });
});
