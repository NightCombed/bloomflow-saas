import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Flower2, Menu } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { CartProvider } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { CartIconButton } from "@/components/store/CartIconButton";
import { CartDrawer } from "@/components/store/CartDrawer";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";
import { cn } from "@/lib/utils";

function PublicStoreShell() {
  const { store, settings } = useTenant();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!store) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div className="max-w-md space-y-3">
          <Flower2 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="font-serif text-3xl">Loja não encontrada</h1>
          <p className="text-muted-foreground">
            Verifique o endereço da floricultura ou volte para a{" "}
            <Link to="/" className="text-primary underline underline-offset-4">página inicial</Link>.
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: `/loja/${store.slug}`, label: "Início", end: true },
    { to: `/loja/${store.slug}/produtos`, label: "Produtos", end: false },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "transition-colors hover:text-primary",
      isActive ? "text-primary font-medium" : "text-foreground"
    );

  // Apply per-store brand colors as scoped CSS variables (HSL "H S% L%")
  const brandStyle = {
    ...(settings?.brand_color ? { ["--primary" as any]: settings.brand_color, ["--ring" as any]: settings.brand_color } : {}),
    ...(settings?.secondary_color ? { ["--accent" as any]: settings.secondary_color } : {}),
  } as React.CSSProperties;

  const contactMessage =
    settings?.contact_message_template ??
    `Olá, ${settings?.display_name ?? store.name}! Gostaria de fazer um pedido.`;

  return (
    <div style={brandStyle} className="min-h-screen flex flex-col bg-gradient-soft">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to={`/loja/${store.slug}`} className="flex items-center gap-2 min-w-0">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.display_name ?? store.name}
                className="h-9 w-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                <Flower2 className="h-4 w-4" />
              </span>
            )}
            <span className="font-serif text-xl font-semibold truncate">
              {settings?.display_name ?? store.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm">
            {navItems.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={navLinkClass}>
                {it.label}
              </NavLink>
            ))}
            <a href="#contato" className="hover:text-primary transition-colors">Contato</a>
          </nav>

          <div className="flex items-center gap-1">
            <CartIconButton onClick={() => setCartOpen(true)} />

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="font-serif text-2xl text-left">
                    {settings?.display_name ?? store.name}
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {navItems.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "px-3 py-3 rounded-md text-base transition-colors",
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                        )
                      }
                    >
                      {it.label}
                    </NavLink>
                  ))}
                  <a
                    href="#contato"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-3 rounded-md text-base hover:bg-secondary"
                  >
                    Contato
                  </a>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer id="contato" className="border-t border-border/60 bg-background">
        <div className="container py-10 grid gap-6 md:grid-cols-3 text-sm">
          <div>
            <div className="font-serif text-lg mb-2">{settings?.display_name}</div>
            <p className="text-muted-foreground">{settings?.tagline}</p>
          </div>
          <div>
            <div className="font-medium mb-2">Contato</div>
            {settings?.whatsapp && <p className="text-muted-foreground">{settings.whatsapp}</p>}
            {settings?.address && <p className="text-muted-foreground">{settings.address}</p>}
            {settings?.opening_hours && (
              <p className="text-muted-foreground mt-1">{settings.opening_hours}</p>
            )}
            {settings?.whatsapp && (
              <div className="mt-3">
                <WhatsAppButton phone={settings.whatsapp} message={contactMessage} />
              </div>
            )}
          </div>
          <div className="md:text-right text-muted-foreground">
            Powered by <Link to="/" className="text-primary">FlorFlow</Link>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <WhatsAppButton
        phone={settings?.whatsapp}
        message={contactMessage}
        variant="floating"
      />
    </div>
  );
}

export default function PublicStoreLayout() {
  return (
    <CartProvider>
      <PublicStoreShell />
    </CartProvider>
  );
}
