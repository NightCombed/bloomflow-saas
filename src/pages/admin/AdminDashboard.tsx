import { useAuth } from "@/contexts/AuthContext";
import { byStore, formatBRL } from "@/lib/mockData";
import { Package, ShoppingBag, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { memberships } = useAuth();
  const store = memberships[0]?.store;
  if (!store) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Você ainda não está vinculado a nenhuma loja.</p>
      </div>
    );
  }

  const products = byStore.products(store.id);
  const orders = byStore.orders(store.id);
  const customers = byStore.customers(store.id);
  const revenue = orders.reduce((s, o) => s + o.total_cents, 0);

  const stats = [
    { label: "Produtos", value: products.length, icon: Package },
    { label: "Pedidos", value: orders.length, icon: ShoppingBag },
    { label: "Clientes", value: customers.length, icon: Users },
    { label: "Receita", value: formatBRL(revenue), icon: TrendingUp },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <h1 className="font-serif text-3xl mb-1">Visão geral</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho de {store.name}.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="font-serif text-2xl">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card">
        <header className="p-5 border-b border-border">
          <h2 className="font-serif text-xl">Pedidos recentes</h2>
        </header>
        <div className="divide-y divide-border">
          {orders.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">Nenhum pedido ainda.</div>
          )}
          {orders.map((o) => {
            const customer = byStore.customers(store.id).find((c) => c.id === o.customer_id);
            return (
              <div key={o.id} className="p-5 flex items-center justify-between">
                <div>
                  <div className="font-medium">{customer?.name ?? "Cliente"}</div>
                  <div className="text-xs text-muted-foreground">#{o.id} · {o.status}</div>
                </div>
                <div className="font-medium">{formatBRL(o.total_cents)}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
