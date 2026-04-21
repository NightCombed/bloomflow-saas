import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Flower2 } from "lucide-react";

import { useActiveStore } from "@/hooks/useActiveStore";
import { useMockData } from "@/hooks/useMockData";
import { byStore, updateStoreSettings } from "@/lib/mockData";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

const HSL_REGEX = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;

const schema = z.object({
  display_name: z.string().trim().min(2, "Informe o nome da loja").max(80),
  tagline: z.string().trim().max(280).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  address_street: z.string().trim().max(120).optional().or(z.literal("")),
  address_number: z.string().trim().max(20).optional().or(z.literal("")),
  address_neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  address_city: z.string().trim().max(80).optional().or(z.literal("")),
  address_state: z.string().trim().max(40).optional().or(z.literal("")),
  opening_hours: z.string().trim().max(160).optional().or(z.literal("")),
  brand_color: z.string().trim().regex(HSL_REGEX, "Use o formato H S% L% (ex: 145 22% 32%)"),
  secondary_color: z.string().trim().regex(HSL_REGEX, "Use o formato H S% L%").optional().or(z.literal("")),
  logo_url: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  contact_message_template: z.string().trim().max(280).optional().or(z.literal("")),
});

type Values = z.infer<typeof schema>;

export default function AdminSettings() {
  const store = useActiveStore();
  const snapshot = useMockData();
  const [saving, setSaving] = useState(false);

  const settings = useMemo(
    () => (store ? byStore.settings(store.id) : null),
    [store, snapshot.version],
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: "",
      tagline: "",
      whatsapp: "",
      address_street: "",
      address_number: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      opening_hours: "",
      brand_color: "145 22% 32%",
      secondary_color: "",
      logo_url: "",
      contact_message_template: "",
    },
  });

  // Hydrate when store/settings become available
  useEffect(() => {
    if (!settings) return;
    form.reset({
      display_name: settings.display_name ?? "",
      tagline: settings.tagline ?? "",
      whatsapp: settings.whatsapp ?? "",
      address_street: settings.address_street ?? "",
      address_number: settings.address_number ?? "",
      address_neighborhood: settings.address_neighborhood ?? "",
      address_city: settings.address_city ?? "",
      address_state: settings.address_state ?? "",
      opening_hours: settings.opening_hours ?? "",
      brand_color: settings.brand_color ?? "145 22% 32%",
      secondary_color: settings.secondary_color ?? "",
      logo_url: settings.logo_url ?? "",
      contact_message_template: settings.contact_message_template ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.store_id]);

  if (!store) {
    return (
      <div className="max-w-3xl">
        <h1 className="font-serif text-3xl">Configurações</h1>
        <p className="text-muted-foreground mt-2">Nenhuma loja ativa.</p>
      </div>
    );
  }

  const onSubmit = (values: Values) => {
    setSaving(true);
    try {
      updateStoreSettings(store.id, {
        display_name: values.display_name,
        tagline: values.tagline || undefined,
        whatsapp: values.whatsapp || undefined,
        address_street: values.address_street || undefined,
        address_number: values.address_number || undefined,
        address_neighborhood: values.address_neighborhood || undefined,
        address_city: values.address_city || undefined,
        address_state: values.address_state || undefined,
        opening_hours: values.opening_hours || undefined,
        brand_color: values.brand_color,
        secondary_color: values.secondary_color || undefined,
        logo_url: values.logo_url || null,
        contact_message_template: values.contact_message_template || undefined,
      });
      toast.success("Configurações salvas", {
        description: "As alterações já estão visíveis na loja.",
      });
    } finally {
      setSaving(false);
    }
  };

  const watched = form.watch();
  const previewStyle = {
    ["--primary" as any]: watched.brand_color || "145 22% 32%",
    ...(watched.secondary_color ? { ["--accent" as any]: watched.secondary_color } : {}),
  } as React.CSSProperties;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Configurações da loja</h1>
        <p className="text-muted-foreground mt-1">
          Personalize identidade, contato e mensagem da {store.name}.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Identidade */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Identidade</h2>

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da loja *</FormLabel>
                  <FormControl><Input placeholder="Ex: Rosa Bela" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem da loja</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Flores para todos os momentos 🌸 Entregamos com carinho na sua região."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Aparece na home pública como destaque principal.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo (URL da imagem)</FormLabel>
                  <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                  <FormDescription>
                    Opcional. Se vazio, usamos um ícone com o nome da loja.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Identidade visual */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Cores da loja</h2>
            <p className="text-sm text-muted-foreground -mt-2">
              Use o formato HSL: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">H S% L%</code> (ex: 145 22% 32%).
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor principal *</FormLabel>
                    <div className="flex items-center gap-3">
                      <span
                        className="h-10 w-10 rounded-md border border-border shrink-0"
                        style={{ background: `hsl(${field.value})` }}
                      />
                      <FormControl><Input placeholder="145 22% 32%" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor secundária (opcional)</FormLabel>
                    <div className="flex items-center gap-3">
                      <span
                        className="h-10 w-10 rounded-md border border-border shrink-0"
                        style={{ background: field.value ? `hsl(${field.value})` : "transparent" }}
                      />
                      <FormControl><Input placeholder="16 55% 56%" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Live preview */}
            <div style={previewStyle} className="rounded-lg border border-border p-4 bg-background">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Pré-visualização
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Flower2 className="h-4 w-4" />
                </span>
                <span className="font-serif text-lg">{watched.display_name || store.name}</span>
                <Button type="button" size="sm">Botão principal</Button>
                <Button type="button" size="sm" variant="outline">Secundário</Button>
              </div>
            </div>
          </section>

          {/* Contato */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Contato</h2>

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl><Input placeholder="+55 11 90000-0000" {...field} /></FormControl>
                  <FormDescription>Usado nos botões de contato e pedidos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_message_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem padrão do WhatsApp</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Olá! Gostaria de fazer um pedido pela loja..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opening_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário de funcionamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Segunda a sábado, das 08:00 às 18:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Endereço */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-soft">
            <h2 className="font-serif text-xl">Endereço da loja</h2>
            <p className="text-sm text-muted-foreground -mt-2">
              Exibido no rodapé do site e usado para retirada na loja.
            </p>

            <div className="grid sm:grid-cols-[1fr_120px] gap-4">
              <FormField
                control={form.control}
                name="address_street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl><Input placeholder="Rua das Acácias" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl><Input placeholder="120" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="address_neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl><Input placeholder="Pinheiros" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl><Input placeholder="SP" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3">
            <Button type="submit" disabled={saving} size="lg">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
