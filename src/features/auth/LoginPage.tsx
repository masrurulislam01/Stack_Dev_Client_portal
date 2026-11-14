import {useState} from 'react';
import {AuthSplitShell} from '@/features/auth/AuthSplitShell';
import {ForgotPasswordForm} from '@/features/auth/ForgotPasswordForm';
import {LoginForm} from '@/features/auth/LoginForm';
import {useAuth} from '@/hooks/useAuth';

export function LoginPage() {
  const {clearAuthError} = useAuth();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  const switchMode = (nextMode: 'login' | 'forgot') => {
    setMode(nextMode);
    clearAuthError();
  };

  return (
    <AuthSplitShell>
      {mode === 'login' ? (
        <LoginForm onForgotPassword={() => switchMode('forgot')} />
      ) : (
        <ForgotPasswordForm onBack={() => switchMode('login')} />
      )}
    </AuthSplitShell>
  );
}
