/**
 * FlorFlow — Domain types (multi-tenant).
 * Every tenant-scoped entity carries `store_id`.
 * These shapes mirror the planned Supabase schema; swap the mock layer
 * for real queries without changing component contracts.
 */

export type UUID = string;
export type ISODate = string;

/* ---------- Platform-level ---------- */

export type PlatformRole = "super_admin"; // global FlorFlow staff
export type StoreRole = "owner" | "manager" | "staff";

export interface PlatformUser {
  id: UUID;
  email: string;
  full_name: string;
  platform_role?: PlatformRole; // null for normal store users
  created_at: ISODate;
}

export interface Store {
  id: UUID;
  slug: string;              // subdomain key — e.g. "rosa-bela"
  name: string;
  custom_domain?: string | null;
  status: "active" | "trial" | "suspended";
  created_at: ISODate;
}

export interface StoreMember {
  id: UUID;
  store_id: UUID;
  user_id: UUID;
  role: StoreRole;
  created_at: ISODate;
}

export interface StoreSettings {
  store_id: UUID;
  display_name: string;
  tagline?: string;
  logo_url?: string | null;
  brand_color: string;       // hsl token override
  whatsapp?: string;
  address?: string;
  currency: string;          // "BRL"
  timezone: string;          // "America/Sao_Paulo"
}

/* ---------- Catalog ---------- */

export interface Category {
  id: UUID;
  store_id: UUID;
  name: string;
  slug: string;
  position: number;
}

export interface Product {
  id: UUID;
  store_id: UUID;
  category_id?: UUID | null;
  name: string;
  description?: string;
  price_cents: number;
  image_url?: string | null;
  active: boolean;
  stock?: number | null;
  created_at: ISODate;
}

/* ---------- Customers & Orders ---------- */

export interface Customer {
  id: UUID;
  store_id: UUID;
  name: string;
  email?: string;
  phone?: string;
  created_at: ISODate;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "canceled";

export type DeliveryType = "delivery" | "pickup";

export interface OrderAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  full?: string; // pre-rendered single-line for display
}

export interface Order {
  id: UUID;
  store_id: UUID;
  customer_id: UUID;
  status: OrderStatus;
  delivery_type: DeliveryType;
  shipping_region_id?: UUID | null;
  shipping_region_name?: string | null;
  shipping_fee_cents: number;
  subtotal_cents: number;
  total_cents: number;
  delivery_id?: UUID | null;
  created_at: ISODate;
}

export interface OrderItem {
  id: UUID;
  store_id: UUID;
  order_id: UUID;
  product_id: UUID;
  quantity: number;
  unit_price_cents: number;
}

/* ---------- Logistics ---------- */

export interface ShippingRule {
  id: UUID;
  store_id: UUID;
  name: string;              // neighborhood / region name shown to customer
  region?: string;           // optional extra (e.g. CEP prefix)
  price_cents: number;
  eta_hours?: number;
  active: boolean;
}

export interface Delivery {
  id: UUID;
  store_id: UUID;
  order_id: UUID;
  recipient_name: string;
  address: string;
  scheduled_for: ISODate;
  status: "scheduled" | "in_transit" | "delivered" | "failed";
}
