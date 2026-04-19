import { Link } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { byStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import { CategoryPills } from "@/components/store/CategoryPills";

export default function PublicStoreHome() {
  const { store, settings } = useTenant();
  if (!store) return null;
  const products = byStore.products(store.id).filter((p) => p.active).slice(0, 6);
  const categories = byStore.categories(store.id);

  return (
    <>
      <section className="container py-12 md:py-24">
        <div className="max-w-2xl space-y-5 animate-fade-in">
          <span className="text-xs uppercase tracking-widest text-accent font-medium">
            Floricultura artesanal
          </span>
          <h1 className="font-serif text-4xl md:text-6xl leading-tight">
            {settings?.tagline ?? "Flores frescas para todos os momentos."}
          </h1>
          <p className="text-lg text-muted-foreground">
            Buquês, arranjos e plantas selecionadas com carinho. Entrega no mesmo dia em toda a região.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to={`/loja/${store.slug}/produtos`}>Ver produtos</Link>
            </Button>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container pb-6">
          <CategoryPills storeSlug={store.slug} categories={categories} />
        </section>
      )}

      <section className="container pb-20">
        <div className="flex items-end justify-between mb-8 gap-4">
          <h2 className="font-serif text-3xl">Destaques</h2>
          <Link to={`/loja/${store.slug}/produtos`} className="text-sm text-primary hover:underline whitespace-nowrap">
            Ver todos →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug={store.slug} />
          ))}
        </div>
      </section>
    </>
  );
}
