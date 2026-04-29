import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveStore } from "@/hooks/useActiveStore";
import { formatBRL, ORDER_STATUS_LABEL } from "@/lib/mockData";
import { Clock, Package, ShoppingBag, Truck, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const store = useActiveStore();

  const { data: dailyOrders = [] } = useQuery({
    queryKey: ["admin-dashboard-daily", store?.id],
    queryFn: async () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("orders")
        .select("status, total_cents")
        .eq("store_id", store!.id)
        .gte("created_at", startOfToday.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["admin-dashboard-recent", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, status, total_cents, created_at")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: top = [] } = useQuery({
    queryKey: ["admin-dashboard-top", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, line_total_cents")
        .eq("store_id", store!.id);
      if (error) throw error;
      
      const map = new Map<string, { product_id: string; product_name: string; quantity: number; revenue_cents: number }>();
      data.forEach(item => {
        const id = item.product_id;
        if (!map.has(id)) {
          map.set(id, { product_id: id, product_name: item.product_name, quantity: 0, revenue_cents: 0 });
        }
        const prod = map.get(id)!;
        prod.quantity += item.quantity;
        prod.revenue_cents += item.line_total_cents;
      });

      return Array.from(map.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    },
    enabled: !!store?.id,
  });

  if (!store) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Você ainda não está vinculado a nenhuma loja.</p>
      </div>
    );
  }

  const todayRevenue = dailyOrders.reduce((sum, o) => sum + o.total_cents, 0);
  const todayOrders = dailyOrders.length;
  const pending = dailyOrders.filter((o) => o.status === "pending").length;
  const preparing = dailyOrders.filter((o) => o.status === "preparing").length;
  const outForDelivery = dailyOrders.filter((o) => o.status === "out_for_delivery").length;
  const delivered = dailyOrders.filter((o) => o.status === "delivered").length;

  const kpis = [
    { label: "Vendas hoje", value: formatBRL(todayRevenue), icon: TrendingUp, accent: "text-primary" },
    { label: "Pedidos hoje", value: todayOrders, icon: ShoppingBag, accent: "text-primary" },
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
              return (
                <Link
                  key={o.id}
                  to={`/admin/pedidos/${o.id}`}
                  className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{o.customer_name ?? "Cliente"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      #{o.order_number || o.id.slice(-6).toUpperCase()} · {ORDER_STATUS_LABEL[o.status as keyof typeof ORDER_STATUS_LABEL]} · {new Date(o.created_at).toLocaleString("pt-BR")}
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
                  <div className="font-medium truncate">{row.product_name ?? "Produto"}</div>
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
