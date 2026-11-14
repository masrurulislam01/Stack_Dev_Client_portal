import {zodResolver} from '@hookform/resolvers/zod';
import {ArrowLeft, CheckCircle2, Mail} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormParsed,
  type ForgotPasswordFormValues,
} from '@/types/schemas';

export function ForgotPasswordForm({onBack}: {onBack: () => void}) {
  const {resetPassword, authError, clearAuthError} = useAuth();
  const {t} = useLanguage();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<ForgotPasswordFormValues, unknown, ForgotPasswordFormParsed>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {email: ''},
  });

  const activeError = submitError ?? authError;

  const onSubmit = async (values: ForgotPasswordFormParsed) => {
    setSubmitError(null);
    setSuccessMessage(null);
    clearAuthError();
    try {
      await resetPassword(values.email);
      setSuccessMessage(
        `If an account exists for ${values.email}, a password reset link has been sent. Open the link in your email to set a new password.`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send reset email.');
    }
  };

  return (
    <>
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 mb-3 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t.actions.backToSignIn}</span>
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Reset Password
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          Enter your account email and we will send you a password reset link.
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

      {successMessage && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="reset-email"
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
              id="reset-email"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          {isSubmitting ? 'Sending reset link...' : t.actions.sendResetLink}
        </button>
      </form>
    </>
  );
}
