import {zodResolver} from '@hookform/resolvers/zod';
import {ArrowLeft, CheckCircle2, Mail} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Input} from '@/components/ui';
import {useAuth, useLanguage} from '@/hooks';
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormParsed,
  type ForgotPasswordFormValues,
} from '@/types/portal';

export interface ForgotPasswordFormProps {
  onBackClick: () => void;
}

export function ForgotPasswordForm({onBackClick}: ForgotPasswordFormProps) {
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
          onClick={onBackClick}
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
        <Input
          id="reset-email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          leftIcon={<Mail className="w-4 h-4" aria-hidden="true" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending reset link...' : t.actions.sendResetLink}
        </Button>
      </form>
    </>
  );
}
