import { useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { toast } from "@/hooks/use-toast";

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminProducts() {
  const store = useActiveStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store!.id)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        store_id: p.store_id,
        category_id: p.category_id,
        name: p.name,
        description: p.description,
        price_cents: p.price_cents,
        image_url: p.image_url,
        active: p.is_active,
        stock: p.stock_qty,
        created_at: p.created_at,
      })) as Product[];
    },
    enabled: !!store?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", store!.id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        id: c.id,
        store_id: c.store_id,
        name: c.name,
        slug: c.slug,
        position: c.sort_order ?? 0,
      })) as Category[];
    },
    enabled: !!store?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", store?.id] }),
    onError: () => toast({ title: "Erro ao atualizar produto", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", store?.id] });
      toast({ title: "Produto excluído" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  if (!store) return null;

  const categoryName = (id?: string | null) =>
    id ? categories.find((c) => c.id === id)?.name ?? "—" : "—";

  const rows = products
    .filter((p) => filter === "all" || (filter === "active" ? p.active : !p.active))
    .filter((p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()));

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
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
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
                  <Switch checked={p.active} onCheckedChange={() => toggleMutation.mutate({ id: p.id, active: p.active })} />
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(p)}><Trash2 className="h-4 w-4" /></Button>
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
            <AlertDialogDescription>"{deleteTarget?.name}" será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
