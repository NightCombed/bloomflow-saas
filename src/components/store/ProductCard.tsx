import { Link } from "react-router-dom";
import { Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/mockData";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import type { Product } from "@/types/database";

interface Props {
  product: Product;
  storeSlug: string;
}

export function ProductCard({ product, storeSlug }: Props) {
  const { add } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add({
      productId: product.id,
      name: product.name,
      unit_price_cents: product.price_cents,
      image_url: product.image_url ?? null,
    });
    toast.success("Adicionado ao carrinho", { description: product.name });
  };

  return (
    <Link
      to={`/loja/${storeSlug}/produto/${product.id}`}
      className="group rounded-xl border border-border bg-card overflow-hidden shadow-soft hover:shadow-elegant transition-all"
    >
      <div className="aspect-[4/3] bg-gradient-soft grid place-items-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <Flower2 className="h-16 w-16 text-primary/40" />
        )}
      </div>
      <div className="p-5 space-y-2">
        <h3 className="font-serif text-xl leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between pt-2 gap-2">
          <span className="font-medium text-primary">{formatBRL(product.price_cents)}</span>
          <Button size="sm" variant="outline" onClick={handleAdd}>
            Adicionar
          </Button>
        </div>
      </div>
    </Link>
  );
}
