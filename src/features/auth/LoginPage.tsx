import {useState} from 'react';
import {AuthShell} from '@/features/auth/AuthShell';
import {ForgotPasswordForm} from '@/features/auth/ForgotPasswordForm';
import {LoginForm} from '@/features/auth/LoginForm';
import {useAuth} from '@/hooks';

export function LoginPage() {
  const {clearAuthError} = useAuth();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  const switchMode = (nextMode: 'login' | 'forgot') => {
    clearAuthError();
    setMode(nextMode);
  };

  return (
    <AuthShell>
      {mode === 'login' ? (
        <LoginForm onForgotClick={() => switchMode('forgot')} />
      ) : (
        <ForgotPasswordForm onBackClick={() => switchMode('login')} />
      )}
    </AuthShell>
  );
}
