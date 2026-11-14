import type {ReactNode} from 'react';
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuth, type UserRole} from '../context/AuthContext';
import {NoAccessPage} from '../pages/NoAccessPage';
import {AuthLoadingSkeleton} from './AuthLoadingSkeleton';

export function ProtectedRoute({children}: {children?: ReactNode}) {
  const {user, loading} = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{from: location}} />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children?: ReactNode;
}) {
  const {user, profile, loading} = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{from: location}} />;
  }

  const effectiveRole = profile?.role ?? user.role;
  if (!allowedRoles.includes(effectiveRole)) {
    return <NoAccessPage />;
  }

  return children ? <>{children}</> : <Outlet />;
}
