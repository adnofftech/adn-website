import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

/**
 * Garde de route. L’app autorise le mode invité (démo) : on ne redirige
 * que si `requireAuth` est explicitement demandé.
 */
export function ProtectedRoute({ children, requireAuth = false }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
