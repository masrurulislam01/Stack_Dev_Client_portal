import {zodResolver} from '@hookform/resolvers/zod';
import {Eye, EyeOff, Lock, Mail} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {DEMO_LOGIN_PRESETS} from '@/config/constants';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {isDemoMode} from '@/lib/env';
import {
  loginFormSchema,
  type LoginFormParsed,
  type LoginFormValues,
} from '@/types/schemas';

export function LoginForm({onForgotPassword}: {onForgotPassword: () => void}) {
  const {signIn, authError, clearAuthError} = useAuth();
  const {t} = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: {errors, isSubmitting},
  } = useForm<LoginFormValues, unknown, LoginFormParsed>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {email: '', password: ''},
  });

  const activeError = submitError ?? authError;

  const onSubmit = async (values: LoginFormParsed) => {
    setSubmitError(null);
    clearAuthError();
    try {
      await signIn(values.email, values.password);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const fillDemo = (role: 'admin' | 'client') => {
    const preset = DEMO_LOGIN_PRESETS[role];
    setValue('email', preset.email, {shouldValidate: true});
    setValue('password', preset.password, {shouldValidate: true});
    clearErrors();
    setSubmitError(null);
    clearAuthError();
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Client Portal Sign In
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          Sign in with your Stack Dev client or administrator credentials.
        </p>
      </div>

      {activeError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {activeError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              placeholder="you@company.com"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-colors"
            />
          </div>
          {errors.email && (
            <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="min-h-[32px] px-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {t.actions.forgotPassword}
            </button>
          </div>
          <div className="relative">
            <Lock
              className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              placeholder="Enter your password"
              className="w-full min-h-[44px] pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          {isSubmitting ? t.actions.signingIn : t.actions.signIn}
        </button>
      </form>

      {isDemoMode ? (
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center">
            Local preview accounts (in-memory demo data)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Fill Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('client')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Fill Client
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 text-center">
          Invite-only portal. Contact Stack Dev if you need client access.
        </p>
      )}
    </>
  );
}
