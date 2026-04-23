import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, ExternalLink } from "lucide-react";

export default function AdminLayout() {
  const { user, memberships, signOut, isSuperAdmin } = useAuth();
  const activeStore = memberships[0]?.store;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20 flex items-center gap-3 px-4">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{activeStore?.name ?? "Painel"}</div>
              {activeStore && (
                <div className="text-xs text-muted-foreground truncate">/{activeStore.slug}</div>
              )}
            </div>
            {activeStore && (
              <Button asChild variant="ghost" size="sm">
                <Link to={`/loja/${activeStore.slug}`} target="_blank">
                  <ExternalLink className="h-4 w-4" /> Ver loja
                </Link>
              </Button>
            )}
            {isSuperAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link to="/super-admin">Super admin</Link>
              </Button>
            )}
            <div className="hidden sm:block text-sm text-muted-foreground">{user?.full_name}</div>
            <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>
          <main className="flex-1 p-6 animate-fade-in"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
