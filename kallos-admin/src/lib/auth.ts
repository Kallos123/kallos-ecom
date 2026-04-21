import { api } from "./api";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "CUSTOMER";
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<AdminUser> {
  const res = await api.post<{
    data: { user: AdminUser; accessToken: string; refreshToken: string };
  }>("/auth/login", { email, password });

  const { user, accessToken, refreshToken } = res.data;

  if (user.role !== "ADMIN") {
    throw new Error("Access denied. Admin accounts only.");
  }

  api.setTokens(accessToken, refreshToken);
  return user;
}

export function logoutAdmin() {
  const refreshToken = localStorage.getItem("kallos_refresh_token");
  if (refreshToken) {
    api.post("/auth/logout", { refreshToken }).catch(() => {});
  }
  api.clearTokens();
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("kallos_admin_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function storeUser(user: AdminUser) {
  localStorage.setItem("kallos_admin_user", JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem("kallos_admin_user");
}
