/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AlertTriangle, RefreshCw} from 'lucide-react';
import type {ReactNode} from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {AuthLoadingSkeleton} from './components/AuthLoadingSkeleton';
import {ErrorBoundary} from './components/ErrorBoundary';
import {PortalLayout} from './components/PortalLayout';
import {ProtectedRoute, RoleRoute} from './components/ProtectedRoute';
import {AuthProvider, useAuth} from './context/AuthContext';
import {LanguageProvider} from './context/LanguageContext';
import {ThemeProvider} from './context/ThemeContext';
import {ToastProvider} from './context/ToastContext';
import {envValidationError} from './lib/env';
import {AdminClientsPage} from './pages/AdminClientsPage';
import {AdminDashboardPage} from './pages/AdminDashboardPage';
import {AdminPaymentsPage} from './pages/AdminPaymentsPage';
import {AdminProjectDetailPage} from './pages/AdminProjectDetailPage';
import {AdminProjectsPage} from './pages/AdminProjectsPage';
import {ClientDashboardPage} from './pages/ClientDashboardPage';
import {ClientProjectDetailPage} from './pages/ClientProjectDetailPage';
import {ClientProjectsPage} from './pages/ClientProjectsPage';
import {FilesPage} from './pages/FilesPage';
import {InvoiceDetailPage} from './pages/InvoiceDetailPage';
import {InvoicesPage} from './pages/InvoicesPage';
import {LoginPage} from './pages/LoginPage';
import {MessagesPage} from './pages/MessagesPage';
import {NoAccessPage} from './pages/NoAccessPage';
import {NotFoundPage} from './pages/NotFoundPage';
import {PaymentResultPage} from './pages/PaymentResultPage';
import {SetNewPasswordPage} from './pages/SetNewPasswordPage';
import {SettingsPage} from './pages/SettingsPage';

function PublicOnlyRoute({children}: {children: ReactNode}) {
  const {user, profile, loading, isPasswordRecovery} = useAuth();

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (user) {
    const role = profile?.role ?? user.role;
    return (
      <Navigate
        to={role === 'admin' ? '/admin/dashboard' : '/dashboard'}
        replace
      />
    );
  }

  return <>{children}</>;
}

function HomeRedirect() {
  const {user, profile, loading, isPasswordRecovery} = useAuth();

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = profile?.role ?? user.role;
  return (
    <Navigate
      to={role === 'admin' ? '/admin/dashboard' : '/dashboard'}
      replace
    />
  );
}

function AppRoutes() {
  return (
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
        <Route
          path="/payment/success"
          element={<PaymentResultPage outcome="success" />}
        />
        <Route
          path="/payment/fail"
          element={<PaymentResultPage outcome="fail" />}
        />
        <Route
          path="/payment/cancel"
          element={<PaymentResultPage outcome="cancel" />}
        />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function EnvConfigurationScreen({error}: {error: Error}) {
  const issues = error.message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-12">
      <div
        role="alert"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Supabase Configuration Required
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your environment variables in Secrets or .env
            </p>
          </div>
        </div>

        <ul className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs sm:text-sm text-red-700 dark:text-red-300 space-y-2 list-disc list-inside break-words">
          {issues.map((issue, idx) => (
            <li key={idx}>{issue}</li>
          ))}
        </ul>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            Where to copy these in Supabase Dashboard:
          </p>
          <ul className="space-y-1.5 font-mono text-[11px]">
            <li>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                VITE_SUPABASE_URL
              </span>
              =https://&lt;your-project-ref&gt;.supabase.co{' '}
              <span className="font-sans text-slate-500">(Settings → Data API / General)</span>
            </li>
            <li>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                VITE_SUPABASE_ANON_KEY
              </span>
              =sb_publishable_...{' '}
              <span className="font-sans text-slate-500">
                (Settings → API Keys → Publishable key; never sb_secret_ or service_role)
              </span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Reload App</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  if (envValidationError) {
    return (
      <ThemeProvider>
        <EnvConfigurationScreen error={envValidationError} />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              <AuthProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </AuthProvider>
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
