import { Link, Outlet } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { Flower2 } from "lucide-react";

export default function PublicStoreLayout() {
  const { store, settings } = useTenant();

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-between">
          <Link to={`/loja/${store.slug}`} className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Flower2 className="h-4 w-4" />
            </span>
            <span className="font-serif text-xl font-semibold">{settings?.display_name ?? store.name}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <Link to={`/loja/${store.slug}`} className="hover:text-primary transition-colors">Início</Link>
            <a href="#produtos" className="hover:text-primary transition-colors">Produtos</a>
            <a href="#contato" className="hover:text-primary transition-colors">Contato</a>
          </nav>
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
            <p className="text-muted-foreground">{settings?.whatsapp}</p>
            <p className="text-muted-foreground">{settings?.address}</p>
          </div>
          <div className="md:text-right text-muted-foreground">
            Powered by <Link to="/" className="text-primary">FlorFlow</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
