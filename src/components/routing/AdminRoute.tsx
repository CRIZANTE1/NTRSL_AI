import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminRole } from '../../types/profile';
import { PageSkeleton } from '../PageSkeleton';

export function AdminRoute() {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageSkeleton variant="auth" />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdminRole(profile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
