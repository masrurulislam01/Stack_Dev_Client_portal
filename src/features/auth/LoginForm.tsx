import {zodResolver} from '@hookform/resolvers/zod';
import {Eye, EyeOff, Lock, Mail} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Input} from '@/components/ui';
import {useAuth, useLanguage} from '@/hooks';
import {
  loginFormSchema,
  type LoginFormParsed,
  type LoginFormValues,
} from '@/types/portal';

export interface LoginFormProps {
  onForgotClick: () => void;
}

export function LoginForm({onForgotClick}: LoginFormProps) {
  const {signIn, authError, clearAuthError} = useAuth();
  const {t} = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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
        <Input
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          leftIcon={<Mail className="w-4 h-4" aria-hidden="true" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
          error={errors.password?.message}
          labelRight={
            <button
              type="button"
              onClick={onForgotClick}
              className="min-h-[32px] px-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {t.actions.forgotPassword}
            </button>
          }
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          }
          {...register('password')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? t.actions.signingIn : t.actions.signIn}
        </Button>
      </form>

      <p className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 text-center">
        Invite-only portal. Contact Stack Dev if you need client access.
      </p>
    </>
  );
}
