import { useTenant } from "@/contexts/TenantContext";
import { byStore, formatBRL } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

export default function PublicStoreHome() {
  const { store, settings } = useTenant();
  if (!store) return null;
  const products = byStore.products(store.id).filter((p) => p.active);
  const categories = byStore.categories(store.id);

  return (
    <>
      <section className="container py-16 md:py-24">
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
          <Button size="lg" asChild>
            <a href="#produtos">Ver produtos</a>
          </Button>
        </div>
      </section>

      <section id="produtos" className="container pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-serif text-3xl">Nossos produtos</h2>
          <div className="hidden md:flex gap-2 text-sm text-muted-foreground">
            {categories.map((c) => (
              <span key={c.id} className="px-3 py-1 rounded-full bg-secondary">{c.name}</span>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <article key={p.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-soft hover:shadow-elegant transition-shadow">
              <div className="aspect-[4/3] bg-gradient-soft grid place-items-center text-6xl">🌸</div>
              <div className="p-5 space-y-2">
                <h3 className="font-serif text-xl">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-primary">{formatBRL(p.price_cents)}</span>
                  <Button size="sm" variant="outline">Adicionar</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
