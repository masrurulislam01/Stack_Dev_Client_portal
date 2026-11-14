import {lazy, Suspense, type ReactNode} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import {AuthLoadingSkeleton} from '@/components/layout/AuthLoadingSkeleton';
import {PortalLayout} from '@/components/layout/PortalLayout';
import {ProtectedRoute, RoleRoute} from '@/components/layout/ProtectedRoute';
import {useAuth} from '@/hooks/useAuth';

const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({default: m.LoginPage})),
);
const SetNewPasswordPage = lazy(() =>
  import('@/features/auth/SetNewPasswordPage').then((m) => ({default: m.SetNewPasswordPage})),
);
const NoAccessPage = lazy(() =>
  import('@/features/auth/NoAccessPage').then((m) => ({default: m.NoAccessPage})),
);
const NotFoundPage = lazy(() =>
  import('@/features/auth/NotFoundPage').then((m) => ({default: m.NotFoundPage})),
);
const AdminDashboardPage = lazy(() =>
  import('@/features/dashboard/AdminDashboardPage').then((m) => ({default: m.AdminDashboardPage})),
);
const ClientDashboardPage = lazy(() =>
  import('@/features/dashboard/ClientDashboardPage').then((m) => ({default: m.ClientDashboardPage})),
);
const SettingsPage = lazy(() =>
  import('@/features/dashboard/SettingsPage').then((m) => ({default: m.SettingsPage})),
);
const AdminClientsPage = lazy(() =>
  import('@/features/clients/AdminClientsPage').then((m) => ({default: m.AdminClientsPage})),
);
const AdminProjectsPage = lazy(() =>
  import('@/features/projects/AdminProjectsPage').then((m) => ({default: m.AdminProjectsPage})),
);
const AdminProjectDetailPage = lazy(() =>
  import('@/features/projects/AdminProjectDetailPage').then((m) => ({
    default: m.AdminProjectDetailPage,
  })),
);
const ClientProjectsPage = lazy(() =>
  import('@/features/projects/ClientProjectsPage').then((m) => ({default: m.ClientProjectsPage})),
);
const ClientProjectDetailPage = lazy(() =>
  import('@/features/projects/ClientProjectDetailPage').then((m) => ({
    default: m.ClientProjectDetailPage,
  })),
);
const InvoicesPage = lazy(() =>
  import('@/features/invoices/InvoicesPage').then((m) => ({default: m.InvoicesPage})),
);
const InvoiceDetailPage = lazy(() =>
  import('@/features/invoices/InvoiceDetailPage').then((m) => ({default: m.InvoiceDetailPage})),
);
const AdminPaymentsPage = lazy(() =>
  import('@/features/payments/AdminPaymentsPage').then((m) => ({default: m.AdminPaymentsPage})),
);
const PaymentResultPage = lazy(() =>
  import('@/features/payments/PaymentResultPage').then((m) => ({default: m.PaymentResultPage})),
);
const FilesPage = lazy(() =>
  import('@/features/files/FilesPage').then((m) => ({default: m.FilesPage})),
);
const MessagesPage = lazy(() =>
  import('@/features/messages/MessagesPage').then((m) => ({default: m.MessagesPage})),
);

function PublicOnlyRoute({children}: {children: ReactNode}) {
  const {user, profile, loading, isPasswordRecovery} = useAuth();
  if (loading) return <AuthLoadingSkeleton />;
  if (isPasswordRecovery) return <Navigate to="/reset-password" replace />;
  if (user) {
    const role = profile?.role ?? user.role;
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const {user, profile, loading, isPasswordRecovery} = useAuth();
  if (loading) return <AuthLoadingSkeleton />;
  if (isPasswordRecovery) return <Navigate to="/reset-password" replace />;
  if (!user) return <Navigate to="/login" replace />;
  const role = profile?.role ?? user.role;
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/reset-password" element={<SetNewPasswordPage />} />
        <Route
          path="/no-access"
          element={
            <ProtectedRoute>
              <NoAccessPage />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminClientsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminProjectsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/projects/:projectId"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminProjectDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminPaymentsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={['client']}>
                <ClientDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <RoleRoute allowedRoles={['client']}>
                <ClientProjectsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <RoleRoute allowedRoles={['client']}>
                <ClientProjectDetailPage />
              </RoleRoute>
            }
          />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
          <Route path="/payment/success" element={<PaymentResultPage outcome="success" />} />
          <Route path="/payment/fail" element={<PaymentResultPage outcome="fail" />} />
          <Route path="/payment/cancel" element={<PaymentResultPage outcome="cancel" />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
