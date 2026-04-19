import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { byStore } from "@/lib/mockData";
import { resolveTenantSlug } from "@/lib/tenant";
import type { Store, StoreSettings } from "@/types/database";

interface TenantContextValue {
  store: Store | null;
  settings: StoreSettings | null;
  slug: string | null;
}

const TenantContext = createContext<TenantContextValue>({
  store: null, settings: null, slug: null,
});

interface Props {
  children: ReactNode;
  /** When true, prefers the :slug route param (used by /loja/:slug). */
  fromRoute?: boolean;
}

export function TenantProvider({ children, fromRoute = false }: Props) {
  const params = useParams<{ slug?: string }>();

  const value = useMemo<TenantContextValue>(() => {
    const slug = (fromRoute && params.slug) || resolveTenantSlug();
    if (!slug) return { store: null, settings: null, slug: null };
    const store = byStore.store(slug);
    const settings = store ? byStore.settings(store.id) : null;
    return { store, settings, slug };
  }, [fromRoute, params.slug]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export const useTenant = () => useContext(TenantContext);

/** Throws if no tenant — use inside store-scoped pages. */
export function useRequiredTenant() {
  const t = useTenant();
  if (!t.store) {
    throw new Error("useRequiredTenant: no store resolved for current context");
  }
  return t as Required<TenantContextValue>;
}
