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

const apiRequest = async (path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...createAuthHeaders(token)
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
};

export { API_BASE_URL, createAuthHeaders, apiRequest };
