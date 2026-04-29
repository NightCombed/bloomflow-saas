import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/mockData";
import type { ShippingRule } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const parseBRL = (s: string) => {
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  if (!isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
};

const slugify = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function AdminShipping() {
  const store = useActiveStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ShippingRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [active, setActive] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ShippingRule | null>(null);

  const { data: rules = [] } = useQuery<ShippingRule[]>({
    queryKey: ["shipping-regions", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_regions")
        .select("*")
        .eq("store_id", store!.id)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        store_id: row.store_id,
        name: row.name,
        price_cents: row.fee_cents,
        active: row.is_active,
      }));
    },
    enabled: !!store?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("shipping_regions")
        .update({ is_active: !active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipping-regions", store?.id] }),
    onError: () => toast({ title: "Erro ao atualizar região", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async (vars: { name: string; price_cents: number; active: boolean }) => {
      const { error } = await supabase.from("shipping_regions").insert({
        store_id: store!.id,
        name: vars.name,
        slug: slugify(vars.name),
        fee_cents: vars.price_cents,
        is_active: vars.active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-regions", store?.id] });
      toast({ title: "Região criada" });
      setFormOpen(false);
    },
    onError: () => toast({ title: "Erro ao criar", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; name: string; price_cents: number; active: boolean }) => {
      const { error } = await supabase
        .from("shipping_regions")
        .update({
          name: vars.name,
          slug: slugify(vars.name),
          fee_cents: vars.price_cents,
          is_active: vars.active,
        })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-regions", store?.id] });
      toast({ title: "Região atualizada" });
      setFormOpen(false);
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_regions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-regions", store?.id] });
      toast({ title: "Região excluída" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  if (!store) return null;

  const openCreate = () => {
    setEditing(null); setName(""); setPrice(""); setActive(true); setFormOpen(true);
  };
  const openEdit = (r: ShippingRule) => {
    setEditing(r);
    setName(r.name);
    setPrice((r.price_cents / 100).toFixed(2).replace(".", ","));
    setActive(r.active);
    setFormOpen(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    const cents = parseBRL(price);
    if (editing) {
      updateMutation.mutate({ id: editing.id, name: trimmed, price_cents: cents, active });
    } else {
      createMutation.mutate({ name: trimmed, price_cents: cents, active });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-1">Regiões de entrega</h1>
          <p className="text-muted-foreground">Configure os bairros atendidos e o valor do frete em cada um.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nova região</Button>
      </header>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Nenhuma região cadastrada. Crie a primeira para começar a calcular frete!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rules.map((r) => (
              <div key={r.id} className="p-4 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Frete {formatBRL(r.price_cents)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={r.active}
                    onCheckedChange={() => toggleMutation.mutate({ id: r.id, active: r.active })}
                    aria-label="Ativar região"
                  />
                  <span className="text-xs text-muted-foreground w-14">
                    {r.active ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(r)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar região" : "Nova região"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Nome do bairro / região *</Label>
              <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus placeholder="Ex: Centro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-price">Valor do frete (R$) *</Label>
              <Input id="reg-price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="15,00" />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="reg-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="reg-active" className="cursor-pointer">Região ativa</Label>
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
            <AlertDialogTitle>Excluir região?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" será removida. Pedidos antigos não serão afetados.
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
