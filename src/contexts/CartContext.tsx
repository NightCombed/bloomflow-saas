import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTenant } from "@/contexts/TenantContext";

export interface CartItem {
  productId: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  image_url?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  notes: string;
  itemCount: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const storageKey = (slug: string) => `florflow:cart:${slug}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const { store } = useTenant();
  const slug = store?.slug ?? "__none__";

  const [items, setItems] = useState<CartItem[]>([]);
  const [notes, setNotesState] = useState("");

  // Load on slug change
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(Array.isArray(parsed.items) ? parsed.items : []);
        setNotesState(typeof parsed.notes === "string" ? parsed.notes : "");
      } else {
        setItems([]);
        setNotesState("");
      }
    } catch {
      setItems([]);
      setNotesState("");
    }
  }, [slug]);

  // Persist
  useEffect(() => {
    if (slug === "__none__") return;
    localStorage.setItem(storageKey(slug), JSON.stringify({ items, notes }));
  }, [slug, items, notes]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((n, i) => n + i.quantity, 0);
    const subtotalCents = items.reduce((n, i) => n + i.quantity * i.unit_price_cents, 0);

    return {
      items,
      notes,
      itemCount,
      subtotalCents,
      add: (item, quantity = 1) => {
        setItems((prev) => {
          const existing = prev.find((p) => p.productId === item.productId);
          if (existing) {
            return prev.map((p) =>
              p.productId === item.productId ? { ...p, quantity: p.quantity + quantity } : p
            );
          }
          return [...prev, { ...item, quantity }];
        });
      },
      remove: (productId) => setItems((prev) => prev.filter((p) => p.productId !== productId)),
      updateQty: (productId, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((p) => p.productId !== productId)
            : prev.map((p) => (p.productId === productId ? { ...p, quantity } : p))
        ),
      setNotes: (n) => setNotesState(n.slice(0, 500)),
      clear: () => {
        setItems([]);
        setNotesState("");
      },
    };
  }, [items, notes]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
