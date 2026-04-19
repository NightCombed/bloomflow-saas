import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperAdmin }: Props) {
  const { user, isSuperAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
