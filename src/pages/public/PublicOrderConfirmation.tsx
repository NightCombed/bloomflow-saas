import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Flower2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import { useTenant } from "@/contexts/TenantContext";
import { formatBRL } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";
import { EmptyState } from "@/components/store/EmptyState";

export default function PublicOrderConfirmation() {
  const { store, settings } = useTenant();
  const { orderId } = useParams<{ orderId: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ["public-order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  if (!store) return null;

  if (isLoading) {
    return (
      <div className="container py-16 grid place-items-center min-h-[50vh]">
        <Flower2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Pedido não encontrado"
          action={
            <Button asChild>
              <Link to={`/loja/${store.slug}`}>Voltar à loja</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Handle both possible casing depending on Supabase relations response
  const items = order.order_items || [];
  const orderNumber = order.order_number || order.id.slice(-6).toUpperCase();

  const whatsAppMsg = `Olá! Gostaria de acompanhar meu pedido #${orderNumber}.`;

  return (
    <div className="container py-10 md:py-16 max-w-3xl">
      <div className="text-center space-y-3 mb-8">
        <div className="mx-auto h-16 w-16 grid place-items-center rounded-full bg-primary-muted">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl">Pedido recebido!</h1>
        <p className="text-muted-foreground">
          Pedido <span className="font-medium text-foreground">#{orderNumber}</span> — em
          breve a floricultura entrará em contato para confirmar.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
        <div>
          <h2 className="font-serif text-xl mb-3">Itens</h2>
          <div className="space-y-2">
            {items.map((it: any) => (
              <div key={it.id} className="flex gap-3 text-sm">
                <div className="h-10 w-10 rounded-md bg-gradient-soft grid place-items-center flex-shrink-0 overflow-hidden">
                  <Flower2 className="h-4 w-4 text-primary/40" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{it.product_name ?? "Produto"}</p>
                  <p className="text-muted-foreground">
                    {it.quantity}× {formatBRL(it.unit_price_cents)}
                  </p>
                </div>
                <span className="font-medium tabular-nums">
                  {formatBRL(it.unit_price_cents * it.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatBRL(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete ({order.shipping_region_name || (order.delivery_type === "pickup" ? "Retirada" : "Entrega")})</span>
            <span>{order.shipping_fee_cents > 0 ? formatBRL(order.shipping_fee_cents) : "Grátis"}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-baseline">
          <span className="text-muted-foreground">Total</span>
          <span className="font-serif text-2xl text-primary">{formatBRL(order.total_cents)}</span>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Cliente</p>
            <p className="font-medium">{order.customer_name}</p>
            {order.customer_phone && <p className="text-muted-foreground">{order.customer_phone}</p>}
          </div>
          {(order.delivery_type === "delivery" && order.delivery_address) && (
            <div>
              <p className="text-muted-foreground mb-1">Entrega</p>
              <p className="font-medium">{order.delivery_address}</p>
              {order.scheduled_for && (
                <p className="text-muted-foreground">
                  {format(new Date(order.scheduled_for), "PPP", { locale: ptBR })}
                </p>
              )}
            </div>
          )}
          {order.delivery_type === "pickup" && (
            <div>
              <p className="text-muted-foreground mb-1">Retirada na loja</p>
              <p className="font-medium">{settings?.address ?? "Endereço da loja"}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {settings?.whatsapp && (
          <WhatsAppButton
            phone={settings.whatsapp}
            message={whatsAppMsg}
            label="Falar no WhatsApp"
            className="flex-1 h-11"
          />
        )}
        <Button asChild variant="outline" className="flex-1">
          <Link to={`/loja/${store.slug}`}>Voltar à loja</Link>
        </Button>
      </div>
    </div>
  );
}
