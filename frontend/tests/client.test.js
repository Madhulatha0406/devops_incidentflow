import { buildApiErrorMessage, createAuthHeaders, readResponsePayload } from "../src/api/client";

describe("api client helpers", () => {
  test("creates auth header when token exists", () => {
    expect(createAuthHeaders("token-1")).toEqual({
      Authorization: "Bearer token-1"
    });
  });

  test("returns empty headers when token is absent", () => {
    expect(createAuthHeaders("")).toEqual({});
  });

  test("builds a helpful error when HTML is returned", () => {
    const message = buildApiErrorMessage(
      { status: 502 },
      {
        raw: "<!doctype html><html></html>"
      }
    );

    expect(message).toMatch(/Service returned HTML instead of JSON/);
  });

  test("reads JSON payloads from the response body", async () => {
    const payload = await readResponsePayload({
      headers: {
        get: () => "application/json"
      },
      text: jest.fn().mockResolvedValue('{"status":"ok"}')
    });

    expect(payload).toEqual({ status: "ok" });
  });
});
