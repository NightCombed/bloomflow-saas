/**
 * Mock auth — replace with Supabase auth later.
 * Shape stays stable so consumers don't need to change.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { platformUsers, storeMembers, stores } from "@/lib/mockData";
import type { PlatformUser, Store, StoreRole } from "@/types/database";

interface SessionStore { store: Store; role: StoreRole }

interface AuthContextValue {
  user: PlatformUser | null;
  isSuperAdmin: boolean;
  memberships: SessionStore[];
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "florflow:auth:user_id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id) {
      const u = platformUsers.find((p) => p.id === id);
      if (u) setUser(u);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string) => {
    const u = platformUsers.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!u) return { ok: false, error: "Usuário não encontrado" };
    localStorage.setItem(STORAGE_KEY, u.id);
    setUser(u);
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const memberships: SessionStore[] = user
    ? storeMembers
        .filter((m) => m.user_id === user.id)
        .map((m) => ({ store: stores.find((s) => s.id === m.store_id)!, role: m.role }))
        .filter((m) => m.store)
    : [];

  return (
    <AuthContext.Provider
      value={{
        user,
        isSuperAdmin: user?.platform_role === "super_admin",
        memberships,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
