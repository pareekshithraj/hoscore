import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactElement;
  requireContext?: 'hospital' | 'patient' | 'superadmin';
}

export const ProtectedRoute = ({ children, requireContext }: ProtectedRouteProps) => {
  const { user, activeContext, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific context type is required, validate it
  if (requireContext && activeContext?.type !== requireContext) {
    // Redirect to the appropriate dashboard based on their active context
    if (activeContext?.type === 'superadmin') return <Navigate to="/super-admin" replace />;
    if (activeContext?.type === 'patient') return <Navigate to="/patient" replace />;
    if (activeContext?.type === 'hospital') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};
