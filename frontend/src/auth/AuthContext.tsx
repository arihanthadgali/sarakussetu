import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "../api/client";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./authStorage";
import type { Customer } from "./types";

interface AuthContextValue {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(getAccessToken);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(() => getAccessToken() !== null);

  const loadCustomer = useCallback(async (accessToken: string) => {
    try {
      const currentCustomer = await apiRequest<Customer>("/api/auth/me", {
        method: "GET",
        authenticated: true,
      });

      setCustomer(currentCustomer);
      setToken(accessToken);
    } catch {
      clearAccessToken();
      setToken(null);
      setCustomer(null);
    }
  }, []);

  useEffect(() => {
    const storedToken = getAccessToken();

    if (!storedToken) {
      return;
    }

    loadCustomer(storedToken).finally(() => {
      setIsLoading(false);
    });
  }, [loadCustomer]);

  const login = useCallback(
    async (newToken: string) => {
      setAccessToken(newToken);
      setToken(newToken);

      await loadCustomer(newToken);
    },
    [loadCustomer],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setToken(null);
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      token,
      isAuthenticated: customer !== null && token !== null,
      isLoading,
      login,
      logout,
    }),
    [customer, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}