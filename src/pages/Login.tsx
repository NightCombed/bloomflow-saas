import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Flower2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const { user, signIn, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("owner@rosabela.com");
  const [loading, setLoading] = useState(false);

  if (user) {
    const target = (location.state as any)?.from ?? (isSuperAdmin ? "/super-admin" : "/admin");
    return <Navigate to={target} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn(email);
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Falha no login", description: res.error, variant: "destructive" });
      return;
    }
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:block bg-gradient-botanical relative overflow-hidden">
        <div className="absolute inset-0 grid place-items-center text-primary-foreground p-12">
          <div className="max-w-md space-y-4">
            <Flower2 className="h-10 w-10" />
            <h2 className="font-serif text-4xl leading-tight">Cuide da sua loja, nós cuidamos do resto.</h2>
            <p className="opacity-90">Plataforma multi-tenant para floriculturas. Cada loja, sua história.</p>
          </div>
        </div>
      </div>
      <div className="grid place-items-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Flower2 className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg">FlorFlow</span>
          </Link>
          <div>
            <h1 className="font-serif text-3xl mb-1">Entrar no painel</h1>
            <p className="text-sm text-muted-foreground">Acesse a área administrativa da sua floricultura.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <p className="text-xs text-muted-foreground">
              Demo: <code>owner@rosabela.com</code> ou <code>admin@florflow.app</code>
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
