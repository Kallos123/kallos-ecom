"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import { storeTokens, clearTokens, getToken, type User } from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for forced logout (e.g. token refresh failed)
  useEffect(() => {
    const handler = () => {
      setUser(null);
    };
    window.addEventListener("kallos-logout", handler);
    return () => window.removeEventListener("kallos-logout", handler);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", { email, password });
    storeTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const register = async (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const data = await api.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/auth/register", input);
    storeTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("kallos-refresh-token");
    api.post("/auth/logout", { refreshToken }).catch(() => {});
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshUser: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
