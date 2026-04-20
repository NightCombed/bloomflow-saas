import { Link } from "react-router-dom";
import { useActiveStore } from "@/hooks/useActiveStore";
import { byStore, formatBRL, metrics, ORDER_STATUS_LABEL } from "@/lib/mockData";
import { Clock, Package, ShoppingBag, Truck, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const store = useActiveStore();
  if (!store) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Você ainda não está vinculado a nenhuma loja.</p>
      </div>
    );
  }

  const todayRevenue = metrics.todayRevenueCents(store.id);
  const todayOrders = metrics.ordersToday(store.id);
  const pending = metrics.countByStatus(store.id, "pending");
  const preparing = metrics.countByStatus(store.id, "preparing");
  const outForDelivery = metrics.countByStatus(store.id, "out_for_delivery");
  const delivered = metrics.countByStatus(store.id, "delivered");
  const top = metrics.topProducts(store.id, 5);
  const recent = [...byStore.orders(store.id)]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);
  const customers = byStore.customers(store.id);

  const kpis = [
    { label: "Vendas hoje", value: formatBRL(todayRevenue), icon: TrendingUp, accent: "text-primary" },
    { label: "Pedidos hoje", value: todayOrders.length, icon: ShoppingBag, accent: "text-primary" },
    { label: "Pendentes", value: pending, icon: Clock, accent: "text-amber-600" },
    { label: "Em preparação", value: preparing, icon: Package, accent: "text-blue-600" },
    { label: "Saiu p/ entrega", value: outForDelivery, icon: Truck, accent: "text-violet-600" },
    { label: "Entregues", value: delivered, icon: CheckCircle2, accent: "text-emerald-600" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl mb-1">Visão geral</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho de {store.name}.</p>
        </div>
        <Button asChild>
          <Link to="/admin/pedidos">
            Ver pedidos <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.accent}`} />
            </div>
            <div className="font-serif text-xl">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="rounded-xl border border-border bg-card lg:col-span-2">
          <header className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-xl">Pedidos recentes</h2>
            <Link to="/admin/pedidos" className="text-sm text-primary hover:underline">Ver todos</Link>
          </header>
          <div className="divide-y divide-border">
            {recent.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">Nenhum pedido ainda.</div>
            )}
            {recent.map((o) => {
              const customer = customers.find((c) => c.id === o.customer_id);
              return (
                <Link
                  key={o.id}
                  to={`/admin/pedidos/${o.id}`}
                  className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{customer?.name ?? "Cliente"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      #{o.id} · {ORDER_STATUS_LABEL[o.status]} · {new Date(o.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="font-medium shrink-0 ml-4">{formatBRL(o.total_cents)}</div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <header className="p-5 border-b border-border">
            <h2 className="font-serif text-xl">Mais vendidos</h2>
          </header>
          <div className="divide-y divide-border">
            {top.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">Sem vendas ainda.</div>
            )}
            {top.map((row) => (
              <div key={row.product_id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{row.product?.name ?? "Produto"}</div>
                  <div className="text-xs text-muted-foreground">{row.quantity} vendidos</div>
                </div>
                <div className="text-sm font-medium shrink-0">{formatBRL(row.revenue_cents)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
