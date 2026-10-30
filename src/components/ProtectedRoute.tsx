import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
