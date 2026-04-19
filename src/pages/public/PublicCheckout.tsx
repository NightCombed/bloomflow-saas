import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { useCart } from "@/contexts/CartContext";
import { createOrder, formatBRL } from "@/lib/mockData";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OrderSummary } from "@/components/store/OrderSummary";
import { buildWhatsAppUrl } from "@/components/store/WhatsAppButton";
import { EmptyState } from "@/components/store/EmptyState";
import { cn } from "@/lib/utils";

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100, "Máximo 100 caracteres"),
  phone: z
    .string()
    .trim()
    .min(8, "Telefone inválido")
    .max(20, "Telefone inválido")
    .regex(/^[0-9()+\-\s]+$/, "Use apenas números e ( ) + - "),
  address: z.string().trim().min(4, "Informe o bairro ou endereço").max(200, "Máximo 200 caracteres"),
  deliveryDate: z.date().optional(),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

const NOTE_SUGGESTIONS = [
  "Entregar depois das 18h",
  "É presente",
  "Não tocar a campainha",
  "Deixar com a portaria",
];

export default function PublicCheckout() {
  const { store, settings } = useTenant();
  const { items, subtotalCents, notes, setNotes, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", phone: "", address: "", notes: notes ?? "" },
  });

  // Watch form fields reactively so the WhatsApp href is ALWAYS up-to-date.
  // This avoids any async work inside the click handler, which would break
  // user activation and trigger popup blockers.
  const watched = form.watch();
  const whatsappHref = useMemo(() => {
    if (!settings?.whatsapp || !store) return "#";
    const lines: string[] = [];
    lines.push(`*Novo pedido — ${settings?.display_name ?? store.name}*`, "");
    lines.push("*Itens:*");
    for (const it of items) {
      lines.push(`• ${it.quantity}× ${it.name} — ${formatBRL(it.unit_price_cents * it.quantity)}`);
    }
    lines.push("", `*Total:* ${formatBRL(subtotalCents)}`, "");
    lines.push(`*Cliente:* ${watched.name ?? ""}`);
    lines.push(`*Telefone:* ${watched.phone ?? ""}`);
    lines.push(`*Endereço:* ${watched.address ?? ""}`);
    if (watched.deliveryDate) {
      lines.push(`*Entrega:* ${format(watched.deliveryDate, "dd/MM/yyyy", { locale: ptBR })}`);
    }
    if (watched.notes) lines.push("", `*Observações:* ${watched.notes}`);
    return buildWhatsAppUrl(settings.whatsapp, lines.join("\n"));
  }, [settings?.whatsapp, settings?.display_name, store, items, subtotalCents, watched.name, watched.phone, watched.address, watched.deliveryDate, watched.notes]);

  if (!store) return null;

  if (items.length === 0) {
    return (
      <div className="container py-12">
        <EmptyState
          title="Seu carrinho está vazio"
          description="Adicione produtos antes de finalizar o pedido."
          action={
            <Button asChild>
              <Link to={`/loja/${store.slug}/produtos`}>Ver produtos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const appendNote = (text: string) => {
    const current = form.getValues("notes") ?? "";
    const next = current ? `${current}\n${text}` : text;
    const trimmed = next.slice(0, 500);
    form.setValue("notes", trimmed, { shouldDirty: true });
    setNotes(trimmed);
  };

  const buildWhatsAppMessage = (values: CheckoutValues) => {
    const lines: string[] = [];
    lines.push(`*Novo pedido — ${settings?.display_name ?? store.name}*`, "");
    lines.push("*Itens:*");
    for (const it of items) {
      lines.push(`• ${it.quantity}× ${it.name} — ${formatBRL(it.unit_price_cents * it.quantity)}`);
    }
    lines.push("", `*Total:* ${formatBRL(subtotalCents)}`, "");
    lines.push(`*Cliente:* ${values.name}`);
    lines.push(`*Telefone:* ${values.phone}`);
    lines.push(`*Endereço:* ${values.address}`);
    if (values.deliveryDate) {
      lines.push(`*Entrega:* ${format(values.deliveryDate, "dd/MM/yyyy", { locale: ptBR })}`);
    }
    if (values.notes) lines.push("", `*Observações:* ${values.notes}`);
    return lines.join("\n");
  };

  const onSubmit = (values: CheckoutValues) => {
    setSubmitting(true);
    try {
      const order = createOrder(store.id, {
        customer: { name: values.name, phone: values.phone },
        address: values.address,
        scheduled_for: values.deliveryDate ? values.deliveryDate.toISOString() : null,
        notes: values.notes,
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price_cents: i.unit_price_cents,
        })),
      });
      clear();
      toast.success("Pedido enviado!", { description: "Em breve a floricultura entrará em contato." });
      navigate(`/loja/${store.slug}/pedido/${order.id}`);
    } finally {
      setSubmitting(false);
    }
  };


  const handleWhatsApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!settings?.whatsapp) {
      e.preventDefault();
      toast.error("WhatsApp da loja não configurado");
      return;
    }
    // Synchronous validation only — no await, no form.trigger() — preserves user activation
    const v = form.getValues();
    const missing =
      !v.name?.trim() ||
      !v.phone?.trim() ||
      !v.address?.trim() ||
      v.name.trim().length < 2 ||
      v.phone.trim().length < 8 ||
      v.address.trim().length < 4;
    if (missing) {
      e.preventDefault();
      form.trigger(); // surface field errors in the UI (fire-and-forget)
      toast.error("Preencha os dados antes de enviar pelo WhatsApp");
    }
  };

  return (
    <div className="container py-8 md:py-14">
      <h1 className="font-serif text-3xl md:text-4xl mb-8">Finalizar pedido</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-5 shadow-soft">
              <h2 className="font-serif text-xl">Seus dados</h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Como podemos te chamar?" maxLength={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" maxLength={20} inputMode="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro ou endereço de entrega</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Vila Madalena, Rua X, 123" maxLength={200} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de entrega (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP", { locale: ptBR })
                              : "Escolher uma data"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          locale={ptBR}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-soft">
              <h2 className="font-serif text-xl">Observações</h2>
              <div className="flex flex-wrap gap-2">
                {NOTE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => appendNote(s)}
                    className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        maxLength={500}
                        placeholder="Detalhes para a entrega ou para a floricultura..."
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setNotes(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
                {submitting ? "Enviando..." : "Finalizar pedido"}
              </Button>
              {settings?.whatsapp && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsApp}
                  className="inline-flex items-center justify-center gap-2 flex-1 h-11 px-8 rounded-md text-sm font-medium border border-[hsl(142_70%_45%)] text-[hsl(142_70%_35%)] hover:bg-[hsl(142_70%_45%)] hover:text-white transition-colors"
                >
                  Enviar pelo WhatsApp
                </a>
              )}
            </div>
          </form>
        </Form>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <OrderSummary />
        </aside>
      </div>
    </div>
  );
}
