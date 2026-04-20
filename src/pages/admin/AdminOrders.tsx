import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useMockData } from "@/hooks/useMockData";
import { byStore, formatBRL, ORDER_STATUS_LABEL } from "@/lib/mockData";
import type { Order } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS: (Order["status"] | "all")[] = [
  "all", "pending", "confirmed", "preparing", "out_for_delivery", "delivered", "canceled",
];

const FILTER_LABEL: Record<(typeof FILTERS)[number], string> = {
  all: "Todos",
  pending: "Pendentes",
  confirmed: "Confirmados",
  preparing: "Em preparação",
  out_for_delivery: "Saiu p/ entrega",
  delivered: "Entregues",
  canceled: "Cancelados",
};

const STATUS_BADGE: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  preparing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  out_for_delivery: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  canceled: "bg-muted text-muted-foreground",
};

export default function AdminOrders() {
  const store = useActiveStore();
  const snapshot = useMockData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    if (!store) return [];
    const orders = byStore.orders(store.id);
    const customers = byStore.customers(store.id);
    console.log("[AdminOrders] carregando pedidos", { store_id: store.id, total: orders.length, snapshot: snapshot.version });
    return orders
      .map((o) => ({ order: o, customer: customers.find((c) => c.id === o.customer_id) ?? null }))
      .filter((r) => filter === "all" || r.order.status === filter)
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          r.customer?.name.toLowerCase().includes(q) ||
          r.customer?.phone?.toLowerCase().includes(q) ||
          r.order.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.order.created_at) - +new Date(a.order.created_at));
  }, [store, filter, search, snapshot.version]);

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
            ? byStore.orders(store.id).length
            : byStore.orders(store.id).filter((o) => o.status === f).length;
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
            {rows.map(({ order, customer }) => (
              <Link
                key={order.id}
                to={`/admin/pedidos/${order.id}`}
                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{customer?.name ?? "Cliente"}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_BADGE[order.status])}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    #{order.id} · {customer?.phone ?? "Sem telefone"} · {new Date(order.created_at).toLocaleString("pt-BR")}
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
