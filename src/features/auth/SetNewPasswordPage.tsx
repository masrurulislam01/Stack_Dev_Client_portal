import {CheckCircle2} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {AuthLoadingSkeleton} from '@/components/layout/AuthLoadingSkeleton';
import {Button} from '@/components/ui/Button';
import {AuthSplitShell} from '@/features/auth/AuthSplitShell';
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
    <AuthSplitShell>
      {completed ? (
        <div className="text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-success-soft text-success-text flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-[22px] leading-[30px] font-bold tracking-tight text-foreground">
              Password updated
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              Your new password has been saved and your portal session is active.
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => navigate(user ? dashboardPath : '/login', {replace: true})}
          >
            {user ? 'Continue to Portal' : 'Sign in'}
          </Button>
        </div>
      ) : linkError || !user ? (
        <RecoveryErrorCard linkError={linkError} />
      ) : (
        <SetPasswordForm
          userEmail={user.email}
          onSuccess={() => setCompleted(true)}
        />
      )}
    </AuthSplitShell>
  );
}
