import { useAuth } from "@/contexts/AuthContext";

/** Returns the active store of the logged-in admin user, or null. */
export function useActiveStore() {
  const { memberships } = useAuth();
  return memberships[0]?.store ?? null;
}
