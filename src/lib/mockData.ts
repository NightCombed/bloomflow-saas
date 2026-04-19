/**
 * In-memory mock dataset, fully scoped by store_id.
 * Replace with Supabase queries later — same shapes.
 */
import type {
  Store, StoreSettings, Category, Product, Customer,
  Order, OrderItem, ShippingRule, Delivery, PlatformUser, StoreMember,
} from "@/types/database";

export const stores: Store[] = [
  { id: "st_1", slug: "rosa-bela", name: "Rosa Bela Floricultura", status: "active", created_at: "2025-01-12T10:00:00Z" },
  { id: "st_2", slug: "jardim-do-sol", name: "Jardim do Sol", status: "trial", created_at: "2025-03-04T10:00:00Z" },
];

export const storeSettings: StoreSettings[] = [
  { store_id: "st_1", display_name: "Rosa Bela", tagline: "Flores artesanais entregues no mesmo dia", brand_color: "145 22% 32%", whatsapp: "+55 11 90000-0000", address: "Rua das Acácias, 120 — São Paulo", currency: "BRL", timezone: "America/Sao_Paulo" },
  { store_id: "st_2", display_name: "Jardim do Sol", tagline: "Buquês frescos para todas as ocasiões", brand_color: "16 55% 56%", whatsapp: "+55 21 90000-0000", address: "Av. Atlântica, 500 — Rio de Janeiro", currency: "BRL", timezone: "America/Sao_Paulo" },
];

export const categories: Category[] = [
  { id: "c1", store_id: "st_1", name: "Buquês", slug: "buques", position: 1 },
  { id: "c2", store_id: "st_1", name: "Arranjos", slug: "arranjos", position: 2 },
  { id: "c3", store_id: "st_1", name: "Plantas", slug: "plantas", position: 3 },
  { id: "c4", store_id: "st_2", name: "Buquês", slug: "buques", position: 1 },
];

export const products: Product[] = [
  { id: "p1", store_id: "st_1", category_id: "c1", name: "Buquê de Rosas Vermelhas", description: "12 rosas premium", price_cents: 18900, active: true, stock: 14, created_at: "" },
  { id: "p2", store_id: "st_1", category_id: "c1", name: "Buquê Campestre", description: "Mix de flores do campo", price_cents: 14500, active: true, stock: 8, created_at: "" },
  { id: "p3", store_id: "st_1", category_id: "c2", name: "Arranjo Tropical", description: "Helicônias e folhagens", price_cents: 22900, active: true, stock: 5, created_at: "" },
  { id: "p4", store_id: "st_1", category_id: "c3", name: "Costela-de-Adão", description: "Vaso 25cm", price_cents: 16900, active: true, stock: 11, created_at: "" },
  { id: "p5", store_id: "st_2", category_id: "c4", name: "Buquê Girassol", description: "5 girassóis", price_cents: 12900, active: true, stock: 20, created_at: "" },
];

export const customers: Customer[] = [
  { id: "cu1", store_id: "st_1", name: "Marina Alves", email: "marina@example.com", phone: "+55 11 99999-1111", created_at: "" },
  { id: "cu2", store_id: "st_1", name: "Pedro Souza", email: "pedro@example.com", created_at: "" },
];

export const orders: Order[] = [
  { id: "o1", store_id: "st_1", customer_id: "cu1", status: "preparing", total_cents: 18900, created_at: "2025-04-18T14:00:00Z" },
  { id: "o2", store_id: "st_1", customer_id: "cu2", status: "delivered", total_cents: 33400, created_at: "2025-04-17T09:30:00Z" },
];

export const orderItems: OrderItem[] = [
  { id: "oi1", store_id: "st_1", order_id: "o1", product_id: "p1", quantity: 1, unit_price_cents: 18900 },
  { id: "oi2", store_id: "st_1", order_id: "o2", product_id: "p2", quantity: 1, unit_price_cents: 14500 },
  { id: "oi3", store_id: "st_1", order_id: "o2", product_id: "p4", quantity: 1, unit_price_cents: 16900 },
];

export const shippingRules: ShippingRule[] = [
  { id: "sr1", store_id: "st_1", name: "Centro SP", region: "0101", price_cents: 1500, eta_hours: 3, active: true },
  { id: "sr2", store_id: "st_1", name: "Zona Sul SP", region: "0470", price_cents: 2500, eta_hours: 5, active: true },
];

export const deliveries: Delivery[] = [
  { id: "d1", store_id: "st_1", order_id: "o1", recipient_name: "Marina Alves", address: "R. das Flores, 10", scheduled_for: "2025-04-19T16:00:00Z", status: "scheduled" },
];

export const platformUsers: PlatformUser[] = [
  { id: "u_admin", email: "admin@florflow.app", full_name: "FlorFlow Admin", platform_role: "super_admin", created_at: "" },
  { id: "u_owner1", email: "owner@rosabela.com", full_name: "Helena Rosa", created_at: "" },
];

export const storeMembers: StoreMember[] = [
  { id: "m1", store_id: "st_1", user_id: "u_owner1", role: "owner", created_at: "" },
];

/* Tenant-scoped accessors — mirror the queries you'll do via Supabase RLS. */
export const byStore = {
  store: (slug: string) => stores.find((s) => s.slug === slug) ?? null,
  settings: (store_id: string) => storeSettings.find((s) => s.store_id === store_id) ?? null,
  categories: (store_id: string) => categories.filter((c) => c.store_id === store_id),
  products: (store_id: string) => products.filter((p) => p.store_id === store_id),
  orders: (store_id: string) => orders.filter((o) => o.store_id === store_id),
  customers: (store_id: string) => customers.filter((c) => c.store_id === store_id),
  shippingRules: (store_id: string) => shippingRules.filter((s) => s.store_id === store_id),
  deliveries: (store_id: string) => deliveries.filter((d) => d.store_id === store_id),
};

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
