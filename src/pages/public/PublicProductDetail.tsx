import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Flower2, ShoppingBag } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { byStore, formatBRL } from "@/lib/mockData";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { EmptyState } from "@/components/store/EmptyState";
import { toast } from "sonner";

export default function PublicProductDetail() {
  const { store } = useTenant();
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!store) return null;
  const product = productId ? byStore.product(store.id, productId) : null;

  if (!product || !product.active) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Produto não encontrado"
          description="Este produto pode ter sido removido ou está indisponível."
          action={
            <Button asChild>
              <Link to={`/loja/${store.slug}/produtos`}>Voltar ao catálogo</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const handleAdd = () => {
    add(
      {
        productId: product.id,
        name: product.name,
        unit_price_cents: product.price_cents,
        image_url: product.image_url ?? null,
      },
      qty
    );
    toast.success("Adicionado ao carrinho", { description: `${qty}× ${product.name}` });
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate(`/loja/${store.slug}/checkout`);
  };

  return (
    <div className="container py-8 md:py-14">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link to={`/loja/${store.slug}/produtos`}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square rounded-2xl bg-gradient-soft grid place-items-center overflow-hidden shadow-soft">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Flower2 className="h-32 w-32 text-primary/30" />
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="font-serif text-3xl md:text-5xl leading-tight">{product.name}</h1>
            <p className="font-serif text-3xl text-primary">{formatBRL(product.price_cents)}</p>
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Quantidade</span>
              <QuantityStepper value={qty} onChange={setQty} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Button size="lg" variant="outline" onClick={handleAdd}>
                <ShoppingBag className="h-4 w-4" /> Adicionar
              </Button>
              <Button size="lg" onClick={handleBuyNow}>
                Comprar agora
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
