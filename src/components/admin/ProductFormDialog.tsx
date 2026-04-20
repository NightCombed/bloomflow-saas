import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Category } from "@/types/database";
import { createProduct, updateProduct, type ProductInput } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storeId: string;
  product: Product | null;
  categories: Category[];
}

const NO_CATEGORY = "__none__";

export function ProductFormDialog({ open, onOpenChange, storeId, product, categories }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceReais, setPriceReais] = useState("");
  const [categoryId, setCategoryId] = useState<string>(NO_CATEGORY);
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setPriceReais(product ? (product.price_cents / 100).toFixed(2).replace(".", ",") : "");
    setCategoryId(product?.category_id ?? NO_CATEGORY);
    setImageUrl(product?.image_url ?? "");
    setStock(product?.stock != null ? String(product.stock) : "");
    setActive(product?.active ?? true);
  }, [open, product]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    const cents = Math.round(parseFloat(priceReais.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      toast({ title: "Preço inválido", variant: "destructive" });
      return;
    }

    const payload: ProductInput = {
      name: trimmedName,
      description: description.trim(),
      price_cents: cents,
      category_id: categoryId === NO_CATEGORY ? null : categoryId,
      image_url: imageUrl.trim() || null,
      stock: stock.trim() === "" ? null : Number(stock),
      active,
    };

    if (product) {
      updateProduct(storeId, product.id, payload);
      toast({ title: "Produto atualizado" });
    } else {
      createProduct(storeId, payload);
      toast({ title: "Produto criado" });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>Preencha os dados do produto da sua loja.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Nome *</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Descrição</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-price">Preço (R$) *</Label>
              <Input id="p-price" inputMode="decimal" placeholder="0,00" value={priceReais} onChange={(e) => setPriceReais(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-stock">Estoque</Label>
              <Input id="p-stock" type="number" min={0} placeholder="—" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-img">URL da imagem</Label>
            <Input id="p-img" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="p-active" className="cursor-pointer">Produto ativo</Label>
              <p className="text-xs text-muted-foreground">Visível na loja pública</p>
            </div>
            <Switch id="p-active" checked={active} onCheckedChange={setActive} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{product ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
