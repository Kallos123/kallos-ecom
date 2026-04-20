const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Singleton refresh lock — ensures only one refresh call is in-flight at a time.
// All concurrent 401s await the same promise instead of each firing their own refresh.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("kallos-refresh-token");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      localStorage.setItem("kallos-token", json.data.accessToken);
      localStorage.setItem("kallos-refresh-token", json.data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("kallos-token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Try refreshing token on 401
    if (res.status === 401 && token && typeof window !== "undefined") {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the original request with the new token
        headers["Authorization"] = `Bearer ${localStorage.getItem("kallos-token")}`;
        const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const retryJson = await retry.json().catch(() => ({}));
        if (retry.ok) return retryJson.data ?? retryJson;
      }
      // Refresh failed — clear tokens and signal logout
      localStorage.removeItem("kallos-token");
      localStorage.removeItem("kallos-refresh-token");
      window.dispatchEvent(new Event("kallos-logout"));
    }
    throw new ApiError(json.message || "Something went wrong", res.status);
  }

  return json.data ?? json;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),

  post: <T = any>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export { ApiError };
