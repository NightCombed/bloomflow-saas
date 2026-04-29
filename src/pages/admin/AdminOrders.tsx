import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveStore } from "@/hooks/useActiveStore";
import { formatBRL, ORDER_STATUS_LABEL } from "@/lib/mockData";
import type { Order } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS: (Order["status"] | "all")[] = [
  "all", "pending", "preparing", "out_for_delivery", "delivered", "cancelled",
];

const FILTER_LABEL: Record<string, string> = {
  all: "Todos",
  pending: "Pendentes",
  preparing: "Em preparação",
  out_for_delivery: "Saiu p/ entrega",
  delivered: "Entregues",
  cancelled: "Cancelados",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  preparing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  out_for_delivery: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground",
  // Fallbacks para orders antigas
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  canceled: "bg-muted text-muted-foreground",
};

export default function AdminOrders() {
  const store = useActiveStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const rows = useMemo(() => {
    return orders
      .filter((o) => filter === "all" || o.status === filter)
      .filter((o) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          o.customer_name?.toLowerCase().includes(q) ||
          o.customer_phone?.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.order_number?.toString().includes(q)
        );
      });
  }, [orders, filter, search]);

  if (!store) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="font-serif text-3xl mb-1">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos da loja.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === "all"
            ? orders.length
            : orders.filter((o) => o.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              {FILTER_LABEL[f]} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, telefone ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Nenhum pedido encontrado.</div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((order) => (
              <Link
                key={order.id}
                to={`/admin/pedidos/${order.id}`}
                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{order.customer_name ?? "Cliente"}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_BADGE[order.status])}>
                      {order.status === "confirmed" ? "Em preparação" : ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] || "Cancelado"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {order.delivery_type === "pickup" ? "Retirada" : "Entrega"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    #{order.order_number || order.id.slice(-6).toUpperCase()} · {order.customer_phone ?? "Sem telefone"} · {new Date(order.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="font-medium shrink-0">{formatBRL(order.total_cents)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
