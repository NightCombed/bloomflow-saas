import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantSlug } from "@/lib/tenant";
import type { Store, StoreSettings } from "@/types/database";

interface TenantContextValue {
  store: Store | null;
  settings: StoreSettings | null;
  slug: string | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  store: null, settings: null, slug: null, isLoading: false,
});

interface Props {
  children: ReactNode;
  fromRoute?: boolean;
}

export function TenantProvider({ children, fromRoute = false }: Props) {
  const params = useParams<{ slug?: string }>();
  const slug = (fromRoute && params.slug) || resolveTenantSlug() || null;

  const { data: store = null, isLoading: loadingStore } = useQuery<Store | null>({
    queryKey: ["store", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Store | null;
    },
    enabled: !!slug,
  });

  const { data: settings = null, isLoading: loadingSettings } = useQuery<StoreSettings | null>({
    queryKey: ["store-settings", store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("store_id", store.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Mapeia campos do Supabase para StoreSettings
      return {
        store_id: data.store_id,
        display_name: data.store_name,
        tagline: data.message,
        logo_url: data.logo_url,
        brand_color: data.primary_color || "145 22% 32%",
        secondary_color: data.secondary_color || "16 55% 56%",
        whatsapp: data.whatsapp_number,
        address: [
          [data.address_street, data.address_number].filter(Boolean).join(", "),
          data.address_neighborhood,
          [data.address_city, data.address_state].filter(Boolean).join(" — ")
        ].filter(Boolean).join(" — "),
        address_street: data.address_street,
        address_number: data.address_number,
        address_neighborhood: data.address_neighborhood,
        address_city: data.address_city,
        address_state: data.address_state,
        opening_hours: data.opening_hours,
        contact_message_template: data.contact_message_template,
        currency: "BRL",
        timezone: "America/Sao_Paulo",
      } as StoreSettings;
    },
    enabled: !!store?.id,
  });

  const value = useMemo<TenantContextValue>(() => ({
    store,
    settings,
    slug,
    isLoading: loadingStore || loadingSettings,
  }), [store, settings, slug, loadingStore, loadingSettings]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export const useTenant = () => useContext(TenantContext);

export function useRequiredTenant() {
  const t = useTenant();
  if (!t.store) {
    throw new Error("useRequiredTenant: no store resolved for current context");
  }
  return t as Required<TenantContextValue>;
}
