import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveStore } from "@/hooks/useActiveStore";
import { formatBRL, ORDER_STATUS_LABEL, ORDER_STATUS_FLOW } from "@/lib/mockData";
import type { Order } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MapPin, Copy, MessageCircle, Truck, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function AdminOrderDetail() {
  const store = useActiveStore();
  const { orderId = "" } = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", store?.id, orderId],
    queryFn: async () => {
      if (!orderId || !store) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .eq("store_id", store.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!store?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: Order["status"]) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", store?.id, orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders", store?.id] });
      toast.success(`Status atualizado: ${ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL]}`);
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  if (!store) return null;

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/pedidos"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        </Button>
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground mt-6">
          Carregando pedido...
        </div>
      </div>
    );
  }

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

  const items = order.order_items || [];
  const note = order.notes;
  const address = order.delivery_type === "pickup"
    ? "Retirada na loja"
    : [
      [order.address_street, order.address_number].filter(Boolean).join(", "),
      order.address_neighborhood,
      order.address_complement
    ].filter(Boolean).join(" — ") || "Sem endereço cadastrado";

  const setStatus = (s: Order["status"]) => {
    updateStatus.mutate(s);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para contextos sem HTTPS (ex: http://localhost em alguns browsers)
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) throw new Error("execCommand falhou");
      }
      toast.success(`${label} copiado`);
    } catch (err) {
      console.error("[copyToClipboard] erro:", err);
      toast.error(`Erro ao copiar ${label.toLowerCase()}`);
    }
  };

  const whatsappHref = order.customer_phone
    ? `https://wa.me/${order.customer_phone.replace(/\D/g, "")}`
    : null;

  return (
    <div className="max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/pedidos"><ArrowLeft className="h-4 w-4" /> Pedidos</Link>
      </Button>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl">Pedido #{order.order_number || order.id.slice(-6).toUpperCase()}</h1>
            <span className={cn("text-xs px-2 py-1 rounded-full", STATUS_BADGE[order.status])}>
              {order.status === "confirmed" ? "Em preparação" : ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] || "Cancelado"}
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
        <div className="flex flex-wrap items-center gap-2">
          {/* Reversion Buttons */}
          {(order.status === "preparing" || order.status === "confirmed") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus("pending")}
              disabled={updateStatus.isPending}
            >
              ← Voltar para Pendente
            </Button>
          )}

          {order.status === "out_for_delivery" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus("preparing")}
              disabled={updateStatus.isPending}
            >
              ← Voltar para Em Preparação
            </Button>
          )}

          {order.status === "delivered" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus(order.delivery_type === "pickup" ? "preparing" : "out_for_delivery")}
              disabled={updateStatus.isPending}
            >
              {order.delivery_type === "pickup" ? "← Voltar para Em Preparação" : "← Voltar para Saiu p/ Entrega"}
            </Button>
          )}

          {(order.status === "cancelled" || order.status === "canceled") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus("pending")}
              disabled={updateStatus.isPending}
            >
              Reabrir pedido
            </Button>
          )}

          {/* Separator if both revert and advance options exist */}
          {(order.status === "preparing" || order.status === "confirmed" || order.status === "out_for_delivery") && (
            <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
          )}

          {/* Advance Buttons */}
          {order.status === "pending" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => setStatus("preparing")}
              disabled={updateStatus.isPending}
            >
              Confirmar pedido
            </Button>
          )}

          {(order.status === "pending" || order.status === "preparing" || order.status === "confirmed") && order.delivery_type !== "pickup" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus("out_for_delivery")}
              disabled={updateStatus.isPending}
            >
              Saiu para entrega
            </Button>
          )}

          {(order.status === "pending" || order.status === "preparing" || order.status === "confirmed" || order.status === "out_for_delivery") && (
            <Button
              size="sm"
              variant="default"
              onClick={() => setStatus("delivered")}
              disabled={updateStatus.isPending}
            >
              Entregue
            </Button>
          )}

          {(order.status === "pending" || order.status === "preparing" || order.status === "confirmed" || order.status === "out_for_delivery") && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setStatus("cancelled")}
              disabled={updateStatus.isPending}
            >
              Cancelar pedido
            </Button>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3 lg:col-span-1">
          <h2 className="font-medium">Cliente</h2>
          <div>
            <div className="font-medium">{order.customer_name ?? "—"}</div>
          </div>
          {order.customer_phone && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{order.customer_phone}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(order.customer_phone ?? "", "Telefone")}
              >
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

        {/* Address / Delivery */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium flex items-center gap-2">
              {order.delivery_type === "pickup" ? (
                <><StoreIcon className="h-4 w-4" /> Retirada na loja</>
              ) : (
                <><Truck className="h-4 w-4" /> Entrega</>
              )}
            </h2>
            {order.delivery_type === "delivery" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(address, "Endereço")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          {order.delivery_type === "delivery" ? (
            <>
              <p className="text-sm flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>{address}</span>
              </p>
              {order.shipping_region_name && (
                <div className="text-xs text-muted-foreground">
                  Região: <span className="font-medium text-foreground">{order.shipping_region_name}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              O cliente irá retirar o pedido diretamente na loja.
            </p>
          )}
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
          {items.map((it: any) => {
            return (
              <div key={it.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{it.product_name ?? "Produto"}</div>
                  <div className="text-xs text-muted-foreground">
                    {it.quantity} × {formatBRL(it.unit_price_cents)}
                  </div>
                </div>
                <div className="font-medium shrink-0">{formatBRL(it.quantity * it.unit_price_cents)}</div>
              </div>
            );
          })}
        </div>
        <div className="p-4 space-y-1.5 border-t border-border bg-muted/30">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatBRL(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Frete{order.shipping_region_name ? ` · ${order.shipping_region_name}` : order.delivery_type === "pickup" ? " · Retirada" : ""}
            </span>
            <span className="tabular-nums">
              {order.delivery_type === "pickup" || order.shipping_fee_cents === 0
                ? "—"
                : formatBRL(order.shipping_fee_cents)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-medium">Total</span>
            <span className="font-serif text-xl">{formatBRL(order.total_cents)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
