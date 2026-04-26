import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/api/auth";
import { onUnauthorized, tokenStorage } from "@/lib/api";
import type { LoginPayload, User } from "@/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap on mount
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        authApi.logout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Wire 401 → logout
  useEffect(() => {
    const off = onUnauthorized(() => {
      setUser(null);
    });
    return off;
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const u = await authApi.login(payload);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

/**
 * Detect if user is a bank admin.
 * Logic: organization === "bank" OR role === "admin"
 */
export function isBankAdmin(user: User | null): boolean {
  if (!user) return false;
  const org = String(user.organization ?? "").toLowerCase();
  const role = String(user.role ?? "").toLowerCase();
  return org === "bank" || role === "admin";
}

/**
 * Detect if user is a government user.
 * Logic: organization !== "bank" (and is government/ministry/etc)
 */
export function isGovernmentUser(user: User | null): boolean {
  if (!user) return false;
  const org = String(user.organization ?? "").toLowerCase();
  return org !== "bank" && org !== "";
}
