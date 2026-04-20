import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useMockData } from "@/hooks/useMockData";
import { byStore, createCategory, updateCategory, deleteCategory } from "@/lib/mockData";
import type { Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

export default function AdminCategories() {
  const store = useActiveStore();
  const snapshot = useMockData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { categories, products } = useMemo(() => {
    if (!store) return { categories: [], products: [] };
    return {
      categories: byStore.categories(store.id).slice().sort((a, b) => a.position - b.position),
      products: byStore.products(store.id),
    };
  }, [store, snapshot.version]);

  if (!store) return null;

  const productCount = (id: string) => products.filter((p) => p.category_id === id).length;

  const openCreate = () => { setEditing(null); setName(""); setFormOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setFormOpen(true); };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (editing) {
      updateCategory(store.id, editing.id, { name: trimmed });
      toast({ title: "Categoria atualizada" });
    } else {
      createCategory(store.id, { name: trimmed });
      toast({ title: "Categoria criada" });
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCategory(store.id, deleteTarget.id);
    toast({ title: "Categoria excluída", description: "Produtos vinculados ficaram sem categoria." });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-1">Categorias</h1>
          <p className="text-muted-foreground">Organize seu catálogo em seções.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nova categoria</Button>
      </header>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Nenhuma categoria ainda. Crie a primeira!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((c) => (
              <div key={c.id} className="p-4 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    /{c.slug} · {productCount(c.id)} {productCount(c.id) === 1 ? "produto" : "produtos"}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(c)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome *</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" será removida. Produtos vinculados ficarão sem categoria.
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
