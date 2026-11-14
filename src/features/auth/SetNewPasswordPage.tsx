import {CheckCircle2} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {AuthLoadingSkeleton} from '@/components/layout/AuthLoadingSkeleton';
import {AuthTopBar} from '@/components/layout/AuthTopBar';
import {RecoveryErrorCard} from '@/features/auth/RecoveryErrorCard';
import {SetPasswordForm} from '@/features/auth/SetPasswordForm';
import {useAuth} from '@/hooks/useAuth';

function extractRecoveryLinkError(search: string, hash: string): string | null {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

  const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
  const errorDesc =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error');

  if (!errorCode && !errorDesc) return null;
  if (errorCode === 'otp_expired') {
    return 'This password reset link has expired or was already used. Please request a new reset link.';
  }

  return errorDesc
    ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
    : 'This password reset link is invalid or has expired.';
}

export function SetNewPasswordPage() {
  const {user, profile, loading} = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);

  const linkError = useMemo(
    () => extractRecoveryLinkError(location.search, location.hash),
    [location.search, location.hash],
  );

  if (loading && !linkError) {
    return <AuthLoadingSkeleton />;
  }

  const role = profile?.role ?? user?.role;
  const dashboardPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
      <AuthTopBar showBrand />

      <main className="w-full max-w-md mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          {completed ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Password updated
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your new password has been saved and your portal session is active.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(user ? dashboardPath : '/login', {replace: true})}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {user ? 'Continue to Portal' : 'Sign in'}
              </button>
            </div>
          ) : linkError || !user ? (
            <RecoveryErrorCard linkError={linkError} />
          ) : (
            <SetPasswordForm
              userEmail={user.email}
              onSuccess={() => setCompleted(true)}
            />
          )}
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto text-center text-xs text-slate-600 dark:text-slate-400">
        <span>Stack Dev</span>
        <span aria-hidden="true"> · </span>
        <span>Web &amp; Flutter Studio, Dhaka, Bangladesh</span>
      </footer>
    </div>
  );
}
