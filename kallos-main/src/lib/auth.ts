export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kallos-token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kallos-refresh-token");
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("kallos-token", accessToken);
  localStorage.setItem("kallos-refresh-token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("kallos-token");
  localStorage.removeItem("kallos-refresh-token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
