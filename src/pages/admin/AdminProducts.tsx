import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useMockData } from "@/hooks/useMockData";
import { byStore, formatBRL, deleteProduct, toggleProductActive } from "@/lib/mockData";
import type { Product } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { toast } from "@/hooks/use-toast";

export default function AdminProducts() {
  const store = useActiveStore();
  const snapshot = useMockData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { products, categories } = useMemo(() => {
    if (!store) return { products: [], categories: [] };
    const products = byStore.products(store.id);
    const categories = byStore.categories(store.id);
    console.log("[AdminProducts] produtos carregados", { store_id: store.id, total: products.length, snapshot: snapshot.version });
    return { products, categories };
  }, [store, snapshot.version]);

  const categoryName = (id?: string | null) =>
    id ? categories.find((c) => c.id === id)?.name ?? "—" : "—";

  const rows = useMemo(() => {
    return products
      .filter((p) => filter === "all" || (filter === "active" ? p.active : !p.active))
      .filter((p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, filter, search]);

  if (!store) return null;

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setFormOpen(true); };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProduct(store.id, deleteTarget.id);
    toast({ title: "Produto excluído" });
    setDeleteTarget(null);
  };

  const counts = {
    all: products.length,
    active: products.filter((p) => p.active).length,
    inactive: products.filter((p) => !p.active).length,
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-1">Produtos</h1>
          <p className="text-muted-foreground">Catálogo da sua floricultura.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo produto</Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"} <span className="opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {products.length === 0 ? "Nenhum produto cadastrado. Crie o primeiro!" : "Nenhum produto encontrado."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-md bg-muted shrink-0 overflow-hidden">
                  {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{p.name}</span>
                    {!p.active && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {categoryName(p.category_id)} · Estoque: {p.stock ?? "—"}
                  </div>
                </div>
                <div className="font-medium shrink-0 w-24 text-right">{formatBRL(p.price_cents)}</div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={p.active}
                    onCheckedChange={() => { toggleProductActive(store.id, p.id); }}
                    aria-label="Ativar produto"
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(p)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={store.id}
        product={editing}
        categories={categories}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" será removido permanentemente do catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
