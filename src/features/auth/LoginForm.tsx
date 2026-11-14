import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, Eye, EyeOff, Lock, Mail} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/Button';
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
        <h1 className="font-heading text-[22px] leading-[30px] font-bold tracking-tight text-foreground">
          Client Portal Sign In
        </h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          Sign in with your Stack Dev client or administrator credentials.
        </p>
      </div>

      {activeError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{activeError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-70">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="you@company.com"
                className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors duration-150 focus:outline-none focus:ring-[3px] focus:ring-ring ${
                  errors.email
                    ? 'border-danger focus:border-danger'
                    : 'border-border hover:border-border-strong focus:border-primary-600'
                }`}
              />
            </div>
            {errors.email && (
              <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.email.message}</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-[13px] font-semibold text-foreground"
              >
                Password
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="min-h-[32px] px-1 text-xs font-semibold text-primary-600 hover:text-primary-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                {t.actions.forgotPassword}
              </button>
            </div>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                placeholder="Enter your password"
                className={`w-full min-h-[44px] pl-10 pr-12 py-2.5 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors duration-150 focus:outline-none focus:ring-[3px] focus:ring-ring ${
                  errors.password
                    ? 'border-danger focus:border-danger'
                    : 'border-border hover:border-border-strong focus:border-primary-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] text-muted hover:text-foreground rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.password.message}</span>
              </p>
            )}
          </div>
        </fieldset>

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? t.actions.signingIn : t.actions.signIn}
        </Button>
      </form>

      {isDemoMode ? (
        <div className="mt-5 pt-5 border-t border-border space-y-2.5">
          <p className="text-xs font-medium text-muted text-center">
            Local preview accounts (in-memory demo data)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => fillDemo('admin')}
            >
              Fill Admin
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => fillDemo('client')}
            >
              Fill Client
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 pt-5 border-t border-border text-xs text-muted text-center">
          Invite-only portal. Contact Stack Dev if you need client access.
        </p>
      )}
    </>
  );
}
