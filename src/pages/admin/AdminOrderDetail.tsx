import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useMockData } from "@/hooks/useMockData";
import {
  byStore, formatBRL, ORDER_STATUS_LABEL, ORDER_STATUS_FLOW,
  orderNotes, orderAddresses, products, updateOrderStatus,
} from "@/lib/mockData";
import type { Order } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MapPin, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  preparing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  out_for_delivery: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  canceled: "bg-muted text-muted-foreground",
};

export default function AdminOrderDetail() {
  const store = useActiveStore();
  const { orderId = "" } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  useMockData();

  if (!store) return null;
  const order = byStore.order(store.id, orderId);
  if (!order) {
    return (
      <div className="max-w-3xl">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/pedidos"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        </Button>
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground mt-6">
          Pedido não encontrado.
        </div>
      </div>
    );
  }

  const customer = byStore.customer(store.id, order.customer_id);
  const items = byStore.orderItems(store.id, order.id);
  const note = orderNotes[order.id];
  const address = orderAddresses[order.id] ?? "Sem endereço cadastrado";

  const setStatus = (s: Order["status"]) => {
    updateOrderStatus(store.id, order.id, s);
    toast.success(`Status atualizado: ${ORDER_STATUS_LABEL[s]}`);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const whatsappHref = customer?.phone
    ? `https://wa.me/${customer.phone.replace(/\D/g, "")}`
    : null;

  return (
    <div className="max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/pedidos"><ArrowLeft className="h-4 w-4" /> Pedidos</Link>
      </Button>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl">Pedido #{order.id}</h1>
            <span className={cn("text-xs px-2 py-1 rounded-full", STATUS_BADGE[order.status])}>
              {ORDER_STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Criado em {new Date(order.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="font-serif text-2xl">{formatBRL(order.total_cents)}</div>
      </header>

      {/* Status actions */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium mb-3">Atualizar status</h2>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUS_FLOW.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={order.status === s ? "default" : "outline"}
              onClick={() => setStatus(s)}
            >
              {ORDER_STATUS_LABEL[s]}
            </Button>
          ))}
          <Button
            size="sm"
            variant={order.status === "canceled" ? "default" : "outline"}
            onClick={() => setStatus("canceled")}
            className={order.status === "canceled" ? "" : "text-destructive hover:text-destructive"}
          >
            Cancelar
          </Button>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3 lg:col-span-1">
          <h2 className="font-medium">Cliente</h2>
          <div>
            <div className="font-medium">{customer?.name ?? "—"}</div>
            {customer?.email && <div className="text-sm text-muted-foreground">{customer.email}</div>}
          </div>
          {customer?.phone && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{customer.phone}</span>
              <Button size="icon" variant="ghost" onClick={() => copy(customer.phone!, "Telefone")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
          {whatsappHref && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
              </a>
            </Button>
          )}
        </section>

        {/* Address */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4" /> Entrega</h2>
            <Button size="sm" variant="ghost" onClick={() => copy(address, "Endereço")}>
              <Copy className="h-4 w-4" /> Copiar
            </Button>
          </div>
          <p className="text-sm">{address}</p>
          {note && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Observações</div>
              {note}
            </div>
          )}
        </section>
      </div>

      {/* Items */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="p-5 border-b border-border">
          <h2 className="font-medium">Itens do pedido</h2>
        </header>
        <div className="divide-y divide-border">
          {items.map((it) => {
            const product = products.find((p) => p.id === it.product_id);
            return (
              <div key={it.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{product?.name ?? "Produto"}</div>
                  <div className="text-xs text-muted-foreground">
                    {it.quantity} × {formatBRL(it.unit_price_cents)}
                  </div>
                </div>
                <div className="font-medium shrink-0">{formatBRL(it.quantity * it.unit_price_cents)}</div>
              </div>
            );
          })}
        </div>
        <div className="p-4 flex items-center justify-between border-t border-border bg-muted/30">
          <span className="font-medium">Total</span>
          <span className="font-serif text-xl">{formatBRL(order.total_cents)}</span>
        </div>
      </section>
    </div>
  );
}
