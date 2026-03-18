import { createAuthHeaders } from "../src/api/client";

describe("api client helpers", () => {
  test("creates auth header when token exists", () => {
    expect(createAuthHeaders("token-1")).toEqual({
      Authorization: "Bearer token-1"
    });
  });

  test("returns empty headers when token is absent", () => {
    expect(createAuthHeaders("")).toEqual({});
  });
});
