import {useState} from 'react';
import {AuthTopBar} from '@/components/layout/AuthTopBar';
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
      <AuthTopBar showBrand />

      <main className="w-full max-w-md mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          {mode === 'login' ? (
            <LoginForm onForgotPassword={() => switchMode('forgot')} />
          ) : (
            <ForgotPasswordForm onBack={() => switchMode('login')} />
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
