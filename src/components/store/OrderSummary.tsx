import { Flower2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/lib/mockData";

export function OrderSummary() {
  const { items, subtotalCents } = useCart();

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-soft">
      <h3 className="font-serif text-xl">Resumo do pedido</h3>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.productId} className="flex gap-3">
            <div className="h-12 w-12 flex-shrink-0 rounded-md bg-gradient-soft grid place-items-center overflow-hidden">
              {it.image_url ? (
                <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
              ) : (
                <Flower2 className="h-5 w-5 text-primary/40" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <p className="font-medium leading-tight line-clamp-2">{it.name}</p>
              <p className="text-muted-foreground">
                {it.quantity}× {formatBRL(it.unit_price_cents)}
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums">
              {formatBRL(it.unit_price_cents * it.quantity)}
            </span>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex justify-between items-baseline">
        <span className="text-muted-foreground">Total</span>
        <span className="font-serif text-2xl text-primary">{formatBRL(subtotalCents)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        O valor do frete será confirmado pela floricultura.
      </p>
    </div>
  );
}
