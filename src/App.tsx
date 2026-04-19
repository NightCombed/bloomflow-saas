import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import PublicStoreLayout from "@/components/layouts/PublicStoreLayout";
import PublicStoreHome from "@/pages/public/PublicStoreHome";

import AdminLayout from "@/components/layouts/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { PlaceholderPage } from "@/components/PlaceholderPage";

import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";
import SuperAdminDashboard from "@/pages/super-admin/SuperAdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Marketing */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Public store — slug from route OR subdomain */}
            <Route
              path="/loja/:slug"
              element={
                <TenantProvider fromRoute>
                  <PublicStoreLayout />
                </TenantProvider>
              }
            >
              <Route index element={<PublicStoreHome />} />
            </Route>

            {/* Store admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="produtos" element={<PlaceholderPage title="Produtos" description="Catálogo da sua floricultura." />} />
              <Route path="categorias" element={<PlaceholderPage title="Categorias" />} />
              <Route path="pedidos" element={<PlaceholderPage title="Pedidos" />} />
              <Route path="clientes" element={<PlaceholderPage title="Clientes" />} />
              <Route path="entregas" element={<PlaceholderPage title="Entregas" description="Rotas, regras de frete e agendamentos." />} />
              <Route path="configuracoes" element={<PlaceholderPage title="Configurações" description="Identidade visual, contato e domínio." />} />
            </Route>

            {/* Platform super admin */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SuperAdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
