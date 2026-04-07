const API_BASE_URL =
  (typeof window !== "undefined" && window.__APP_API_BASE_URL__) ||
  (typeof process !== "undefined" && process.env.VITE_API_BASE_URL) ||
  "/api";

const createAuthHeaders = (token) =>
  token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};

const safeParseJson = (rawValue) => {
  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    return null;
  }
};

const readResponsePayload = async (response) => {
  const rawValue = await response.text();

  if (!rawValue) {
    return null;
  }

  const contentType = response.headers?.get?.("content-type") || "";

  if (contentType.includes("application/json")) {
    return safeParseJson(rawValue) || {
      error: "Invalid JSON response from server"
    };
  }

  return safeParseJson(rawValue) || { raw: rawValue };
};

const buildApiErrorMessage = (response, payload) => {
  if (payload?.error) {
    return payload.error;
  }

  if (payload?.message) {
    return payload.message;
  }

  if (typeof payload?.raw === "string" && payload.raw.trim().toLowerCase().startsWith("<!doctype")) {
    return "Service returned HTML instead of JSON. Check that the backend is running and the frontend proxy is configured.";
  }

  return `Request failed (${response.status})`;
};

const apiRequest = async (path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...createAuthHeaders(token)
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(buildApiErrorMessage(response, payload));
  }

  if (payload?.raw) {
    return { message: payload.raw };
  }

  return payload || {};
};

export { API_BASE_URL, buildApiErrorMessage, createAuthHeaders, apiRequest, readResponsePayload };
