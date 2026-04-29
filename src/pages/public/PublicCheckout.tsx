import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MapPin, Store as StoreIcon, Truck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { useTenant } from "@/contexts/TenantContext";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/lib/mockData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ShippingRule } from "@/types/database";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OrderSummary } from "@/components/store/OrderSummary";
import { buildWhatsAppUrl } from "@/components/store/WhatsAppButton";
import { EmptyState } from "@/components/store/EmptyState";
import { cn } from "@/lib/utils";

const baseSchema = z.object({
  delivery_type: z.enum(["delivery", "pickup"]),
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  phone: z
    .string()
    .trim()
    .min(8, "Telefone inválido")
    .max(20)
    .regex(/^[0-9()+\-\s]+$/, "Use apenas números e ( ) + - "),
  street: z.string().trim().max(120).optional(),
  number: z.string().trim().max(20).optional(),
  neighborhood: z.string().trim().max(80).optional(),
  complement: z.string().trim().max(120).optional(),
  immediate: z.boolean(),
  deliveryDate: z.date().optional(),
  notes: z.string().trim().max(500).optional(),
});

const checkoutSchema = baseSchema.superRefine((data, ctx) => {
  if (data.delivery_type === "delivery") {
    if (!data.street || data.street.length < 2) {
      ctx.addIssue({ code: "custom", path: ["street"], message: "Informe a rua" });
    }
    if (!data.number || data.number.length < 1) {
      ctx.addIssue({ code: "custom", path: ["number"], message: "Informe o número" });
    }
    if (!data.neighborhood || data.neighborhood.length < 2) {
      ctx.addIssue({ code: "custom", path: ["neighborhood"], message: "Informe o bairro" });
    }
  }
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

const NOTE_SUGGESTIONS = [
  "Entregar depois das 18h",
  "É presente",
  "Não tocar a campainha",
  "Deixar com a portaria",
];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export default function PublicCheckout() {
  const { store, settings } = useTenant();
  const { items, subtotalCents, notes, setNotes, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      delivery_type: "delivery",
      name: "",
      phone: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      immediate: true,
      notes: notes ?? "",
    },
  });

  const watched = form.watch();
  const deliveryType = watched.delivery_type;
  const neighborhoodInput = watched.neighborhood ?? "";
  const immediate = watched.immediate;

  // Active shipping rules for this store
  const { data: rules = [] } = useQuery<ShippingRule[]>({
    queryKey: ["shipping-regions", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_regions")
        .select("*")
        .eq("store_id", store!.id)
        .eq("is_active", true)
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

  // Match neighborhood -> rule
  const matchedRule = useMemo(() => {
    if (deliveryType !== "delivery") return null;
    const n = norm(neighborhoodInput);
    if (!n) return null;
    return rules.find((r) => norm(r.name) === n) ?? null;
  }, [rules, neighborhoodInput, deliveryType]);

  const suggestions = useMemo(() => {
    const n = norm(neighborhoodInput);
    if (!n) return rules.slice(0, 6);
    return rules.filter((r) => norm(r.name).includes(n)).slice(0, 6);
  }, [rules, neighborhoodInput]);

  const shippingFeeCents = deliveryType === "delivery" ? matchedRule?.price_cents ?? 0 : 0;
  const shippingPending =
    deliveryType === "delivery" && neighborhoodInput.trim().length > 0 && !matchedRule;
  const shippingLabel =
    deliveryType === "pickup"
      ? "Retirada"
      : matchedRule
        ? matchedRule.name
        : null;

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

  const formatAddressLine = (v: CheckoutValues) => {
    const left = [v.street, v.number].filter(Boolean).join(", ");
    return [left, v.neighborhood, v.complement].filter(Boolean).join(" — ");
  };

  const buildWhatsAppMessage = (v: CheckoutValues, totalCents: number) => {
    const lines: string[] = [];
    lines.push(`*Novo pedido — ${settings?.display_name ?? store.name}*`, "");
    lines.push("*Itens:*");
    for (const it of items) {
      lines.push(`• ${it.quantity}× ${it.name} — ${formatBRL(it.unit_price_cents * it.quantity)}`);
    }
    lines.push("", `*Subtotal:* ${formatBRL(subtotalCents)}`);
    lines.push(
      `*Frete:* ${v.delivery_type === "pickup"
        ? "Retirada na loja"
        : matchedRule
          ? `${matchedRule.name} — ${formatBRL(shippingFeeCents)}`
          : shippingFeeCents === 0
            ? "Grátis"
            : formatBRL(shippingFeeCents)
      }`
    );
    lines.push(`*Total:* ${formatBRL(totalCents)}`, "");
    lines.push(`*Cliente:* ${v.name}`);
    lines.push(`*Telefone:* ${v.phone}`);
    if (v.delivery_type === "delivery") {
      lines.push(`*Entrega em:* ${formatAddressLine(v)}`);
    } else {
      lines.push(`*Retirada na loja*${settings?.address ? ` — ${settings.address}` : ""}`);
    }
    if (!v.immediate && v.deliveryDate) {
      lines.push(`*Data:* ${format(v.deliveryDate, "dd/MM/yyyy", { locale: ptBR })}`);
    } else {
      lines.push(`*Quando:* o mais rápido possível`);
    }
    if (v.notes) lines.push("", `*Observações:* ${v.notes}`);
    return lines.join("\n");
  };

  const onSubmit = async (values: CheckoutValues) => {
    if (values.delivery_type === "delivery" && shippingPending) {
      toast.error("Região não atendida", {
        description: "Selecione um bairro da lista ou entre em contato pelo WhatsApp.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const deliveryDate =
        !values.immediate && values.deliveryDate
          ? values.deliveryDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

      const payload = {
        p_store_slug: store.slug,
        p_customer_name: values.name,
        p_customer_phone: values.phone,
        p_delivery_type: values.delivery_type,
        p_delivery_date: deliveryDate,
        p_notes: values.notes || null,
        p_region_slug: values.delivery_type === "delivery" ? (matchedRule?.name
          ? matchedRule.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
          : null)
          : null,
        p_address_street: values.delivery_type === "delivery" ? (values.street ?? null) : null,
        p_address_number: values.delivery_type === "delivery" ? (values.number ?? null) : null,
        p_address_neighborhood: values.delivery_type === "delivery" ? (values.neighborhood ?? null) : null,
        p_address_complement: values.delivery_type === "delivery" ? (values.complement || null) : null,
        p_items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
      };

      const { data, error } = await supabase.rpc("create_public_order", payload);

      if (error) {
        toast.error("Erro ao criar pedido", { description: error.message });
        return;
      }

      const result = data as { order_id: string; order_number: number };
      clear();
      toast.success("Pedido enviado!", { description: "Em breve a floricultura entrará em contato." });
      navigate(`/loja/${store.slug}/pedido/${result.order_id}`);
    } catch (err: any) {
      toast.error("Erro inesperado", { description: err?.message ?? "Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  };

  const totalCents = subtotalCents + (shippingPending ? 0 : shippingFeeCents);

  const whatsappHref = settings?.whatsapp
    ? buildWhatsAppUrl(settings.whatsapp, buildWhatsAppMessage(watched, totalCents))
    : "#";

  const handleWhatsApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!settings?.whatsapp) {
      e.preventDefault();
      toast.error("WhatsApp da loja não configurado");
      return;
    }
    const v = form.getValues();
    if (!v.name?.trim() || !v.phone?.trim()) {
      e.preventDefault();
      form.trigger();
      toast.error("Preencha nome e telefone antes de enviar pelo WhatsApp");
      return;
    }
  };

  return (
    <div className="container py-8 md:py-14">
      <h1 className="font-serif text-3xl md:text-4xl mb-8">Finalizar pedido</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Delivery type selector */}
            <section className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-soft">
              <h2 className="font-serif text-xl">Como você quer receber?</h2>
              <FormField
                control={form.control}
                name="delivery_type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid sm:grid-cols-2 gap-3"
                      >
                        <Label
                          htmlFor="dt-delivery"
                          className={cn(
                            "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                            field.value === "delivery"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          <RadioGroupItem id="dt-delivery" value="delivery" className="mt-1" />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <Truck className="h-4 w-4" /> Entregar
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Receba no endereço informado.
                            </div>
                          </div>
                        </Label>
                        <Label
                          htmlFor="dt-pickup"
                          className={cn(
                            "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                            field.value === "pickup"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          <RadioGroupItem id="dt-pickup" value="pickup" className="mt-1" />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <StoreIcon className="h-4 w-4" /> Retirar na loja
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Sem custo de frete.
                            </div>
                          </div>
                        </Label>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {deliveryType === "pickup" && (
                <div className="rounded-lg bg-muted/50 p-4 text-sm flex gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Endereço da loja</div>
                    <div className="text-muted-foreground mt-0.5">
                      {settings?.address ?? "Endereço não informado pela loja."}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Customer data */}
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
            </section>

            {/* Address — only when delivery */}
            {deliveryType === "delivery" && (
              <section className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-5 shadow-soft">
                <h2 className="font-serif text-xl">Endereço de entrega</h2>

                <div className="grid sm:grid-cols-[1fr_120px] gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Rua das Flores" maxLength={120} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="123" maxLength={20} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Bairro / região</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Comece a digitar..."
                          maxLength={80}
                          autoComplete="off"
                          {...field}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                          onChange={(e) => {
                            field.onChange(e);
                            setShowSuggestions(true);
                          }}
                        />
                      </FormControl>
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-md border border-border bg-popover shadow-md max-h-60 overflow-auto">
                          {suggestions.map((s) => (
                            <button
                              type="button"
                              key={s.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                form.setValue("neighborhood", s.name, { shouldValidate: true });
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between gap-2"
                            >
                              <span className="truncate">{s.name}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {formatBRL(s.price_cents)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {shippingPending && !showSuggestions && (
                        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 mt-1">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>
                            Região não cadastrada. O frete será confirmado pela floricultura — ou
                            entre em contato pelo WhatsApp.
                          </span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, bloco, ponto de referência..." maxLength={120} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>
            )}

            {/* Date */}
            <section className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4 shadow-soft">
              <h2 className="font-serif text-xl">
                {deliveryType === "delivery" ? "Quando entregar?" : "Quando retirar?"}
              </h2>

              <FormField
                control={form.control}
                name="immediate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value ? "now" : "scheduled"}
                        onValueChange={(v) => field.onChange(v === "now")}
                        className="space-y-2"
                      >
                        <Label
                          htmlFor="t-now"
                          className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40"
                        >
                          <RadioGroupItem id="t-now" value="now" />
                          <span className="text-sm">
                            {deliveryType === "delivery"
                              ? "Entregar o mais rápido possível"
                              : "Retirar o mais rápido possível"}
                          </span>
                        </Label>
                        <Label
                          htmlFor="t-sched"
                          className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40"
                        >
                          <RadioGroupItem id="t-sched" value="scheduled" />
                          <span className="text-sm">Escolher uma data</span>
                        </Label>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {!immediate && (
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
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
              )}
            </section>

            {/* Notes */}
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
          <OrderSummary
            shippingFeeCents={shippingFeeCents}
            shippingLabel={shippingLabel}
            shippingPending={shippingPending}
          />
        </aside>
      </div>
    </div>
  );
}
