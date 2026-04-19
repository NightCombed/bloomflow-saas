import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flower2, Store, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import heroImg from "@/assets/florflow-hero.jpg";
import { stores } from "@/lib/mockData";

const features = [
  { icon: Store, title: "Loja própria por floricultura", desc: "Cada loja com seu subdomínio, identidade visual e dados isolados." },
  { icon: ShieldCheck, title: "Multi-tenant seguro", desc: "Separação total por tenant, pronto para RLS no Supabase." },
  { icon: Sparkles, title: "Pronto para escalar", desc: "Painel admin, área pública e base para automações e domínio próprio." },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Flower2 className="h-4 w-4" />
            </span>
            <span className="font-serif text-xl font-semibold">FlorFlow</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/login">Entrar</Link></Button>
            <Button asChild><Link to="/login">Acessar painel</Link></Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-soft">
          <div className="container py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-medium">
                <span className="h-px w-8 bg-accent" /> SaaS para floriculturas
              </span>
              <h1 className="font-serif text-4xl md:text-6xl leading-tight">
                Sua floricultura, <em className="text-primary not-italic">florescendo</em> online.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                FlorFlow é a plataforma multi-tenant que dá a cada floricultura sua loja online,
                painel administrativo e ferramentas de gestão — com dados totalmente isolados.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/login">Começar agora <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/loja/rosa-bela">Ver loja demo</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-bloom opacity-10 rounded-[2rem] blur-2xl" />
              <img
                src={heroImg}
                alt="Buquê de rosas e eucalipto em vaso de terracota"
                width={1600} height={1200}
                className="relative rounded-2xl shadow-elegant w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">Tudo que sua floricultura precisa</h2>
            <p className="text-muted-foreground">
              Do site público ao controle de pedidos — uma única plataforma, várias lojas.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-muted text-primary mb-4">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="font-serif text-xl mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stores demo */}
        <section className="bg-secondary/40 border-y border-border">
          <div className="container py-16">
            <h2 className="font-serif text-3xl mb-8">Floriculturas na plataforma</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {stores.map((s) => (
                <Link
                  key={s.id}
                  to={`/loja/${s.slug}`}
                  className="group rounded-xl border border-border bg-card p-6 flex items-center justify-between hover:border-primary transition-colors"
                >
                  <div>
                    <div className="font-serif text-xl">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{s.slug}.florflow.app</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container py-8 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} FlorFlow</span>
          <span>Multi-tenant SaaS para floriculturas</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
