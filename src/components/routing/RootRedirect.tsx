import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageSkeleton } from '../PageSkeleton';

export function RootRedirect() {
  const { session, loading } = useAuth();

  if (loading) {
    return <PageSkeleton variant="auth" />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
