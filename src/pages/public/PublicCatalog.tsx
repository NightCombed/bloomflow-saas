import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { byStore } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/store/ProductCard";
import { CategoryPills } from "@/components/store/CategoryPills";
import { EmptyState } from "@/components/store/EmptyState";

interface Props {
  byCategory?: boolean;
}

export default function PublicCatalog({ byCategory = false }: Props) {
  const { store } = useTenant();
  const params = useParams<{ catSlug?: string }>();
  const [query, setQuery] = useState("");

  if (!store) return null;
  const categories = byStore.categories(store.id);
  const activeCategory = byCategory && params.catSlug
    ? byStore.category(store.id, params.catSlug)
    : null;
  const storeId = store.id;
  const activeCategoryId = activeCategory?.id ?? null;

  const products = useMemo(() => {
    let list = byStore.products(storeId).filter((p) => p.active);
    if (activeCategoryId) list = list.filter((p) => p.category_id === activeCategoryId);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    return list;
  }, [storeId, activeCategoryId, query]);

  return (
    <div className="container py-10 md:py-14 space-y-8">
      <div className="space-y-3">
        <h1 className="font-serif text-3xl md:text-4xl">
          {activeCategory ? activeCategory.name : "Todos os produtos"}
        </h1>
        <p className="text-muted-foreground">
          Escolha sua flor favorita e adicione ao carrinho.
        </p>
      </div>

      <div className="space-y-4">
        <CategoryPills
          storeSlug={store.slug}
          categories={categories}
          activeSlug={activeCategory?.slug}
        />
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 100))}
            placeholder="Buscar produtos..."
            className="pl-9"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Tente outra categoria ou ajuste a busca."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug={store.slug} />
          ))}
        </div>
      )}
    </div>
  );
}
