import { useMemo, useState, useRef } from "react";
import { Search, Clock, MapPin, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/store/ProductCard";
import { EmptyState } from "@/components/store/EmptyState";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";
import type { Product, Category } from "@/types/database";

// ── Helpers ─────────────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="font-serif text-2xl md:text-3xl shrink-0">{label}</h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PublicStoreHome() {
  const { store, settings } = useTenant();
  const [query, setQuery] = useState("");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const catalogRef = useRef<HTMLElement>(null);

  const storeId = store?.id ?? null;

  // ── Categories ─────────────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", storeId!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        store_id: row.store_id,
        name: row.name,
        slug: row.slug,
        position: row.sort_order,
      }));
    },
    enabled: !!storeId,
  });

  // ── Products ───────────────────────────────────────────────────────────────
  const { data: rawProducts = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["products", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        store_id: row.store_id,
        category_id: row.category_id ?? null,
        name: row.name,
        description: row.description ?? undefined,
        price_cents: row.price_cents,
        image_url: row.image_url ?? null,
        active: row.is_active,
        featured: row.is_featured ?? false,
        stock: row.stock_qty ?? null,
        created_at: row.created_at,
      }));
    },
    enabled: !!storeId,
  });

  // ── Derived data ───────────────────────────────────────────────────────────
  const featuredProducts = useMemo(
    () => rawProducts.filter((p) => (p as Product & { featured?: boolean }).featured),
    [rawProducts],
  );

  const catalogProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rawProducts.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q);
      const matchesCat = !activeCatId || p.category_id === activeCatId;
      return matchesSearch && matchesCat;
    });
  }, [rawProducts, query, activeCatId]);

  if (!store) return null;

  const displayName = settings?.display_name || store.name;
  const tagline = settings?.tagline;
  const whatsapp = settings?.whatsapp;
  const address = settings?.address;
  const openingHours = settings?.opening_hours;

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container py-10 md:py-16">
          <div className="max-w-2xl space-y-4">
            <h1 className="font-serif text-4xl md:text-5xl leading-tight">
              {displayName}
            </h1>

            {tagline && (
              <p className="text-lg text-muted-foreground">{tagline}</p>
            )}

            {/* Info compact row */}
            {(openingHours || address) && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {openingHours && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 text-primary" />
                    {openingHours}
                  </span>
                )}
                {address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    {address}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-1">
              {whatsapp && (
                <WhatsAppButton phone={whatsapp} variant="inline" />
              )}
              <button
                type="button"
                onClick={() =>
                  catalogRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-5 py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Ver catálogo ↓
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESTAQUES ─────────────────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="container py-10 md:py-12">
          <SectionDivider label="Destaques" />

          {/* Mobile: horizontal scroll carousel */}
          <div className="md:hidden -mx-4 px-4">
            <div
              className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none" }}
            >
              {featuredProducts.map((p) => (
                <div key={p.id} className="snap-start shrink-0 w-[72vw] max-w-xs">
                  <ProductCard product={p} storeSlug={store.slug} />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} storeSlug={store.slug} />
            ))}
          </div>
        </section>
      )}

      {/* ── CATÁLOGO COMPLETO ─────────────────────────────────────────────── */}
      <section ref={catalogRef} className="container pb-20 space-y-6">
        <SectionDivider label="Nosso Catálogo" />

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category select */}
          {categories.length > 0 && (
            <div className="relative sm:w-52 shrink-0">
              <select
                value={activeCatId ?? ""}
                onChange={(e) => setActiveCatId(e.target.value || null)}
                className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 100))}
              placeholder="Buscar produtos..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-secondary" />
                <div className="p-5 space-y-3">
                  <div className="h-5 rounded bg-secondary w-3/4" />
                  <div className="h-4 rounded bg-secondary w-full" />
                  <div className="h-4 rounded bg-secondary w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : catalogProducts.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            description={
              query || activeCatId
                ? "Tente outra categoria ou ajuste a busca."
                : "Esta loja ainda não possui produtos disponíveis."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogProducts.map((p) => (
              <ProductCard key={p.id} product={p} storeSlug={store.slug} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
