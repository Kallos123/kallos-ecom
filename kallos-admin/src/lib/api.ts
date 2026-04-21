const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kallos_access_token");
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("kallos_access_token", accessToken);
  localStorage.setItem("kallos_refresh_token", refreshToken);
  document.cookie = "kallos_session=1; path=/; max-age=604800; SameSite=Strict";
}

function clearTokens() {
  localStorage.removeItem("kallos_access_token");
  localStorage.removeItem("kallos_refresh_token");
  document.cookie = "kallos_session=; path=/; max-age=0";
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("kallos_refresh_token");
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  setTokens(data.data.accessToken, data.data.refreshToken);
  return data.data.accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, false);
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  setTokens,
  clearTokens,
};
