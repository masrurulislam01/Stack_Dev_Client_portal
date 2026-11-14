import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, ArrowLeft, CheckCircle2, Mail} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/Button';
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
          disabled={isSubmitting}
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-semibold text-muted hover:text-foreground disabled:opacity-50 mb-3 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t.actions.backToSignIn}</span>
        </button>
        <h1 className="font-heading text-[22px] leading-[30px] font-bold tracking-tight text-foreground">
          Reset Password
        </h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          Enter your account email and we will send you a password reset link.
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

      {successMessage && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-text flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-70">
          <div>
            <label
              htmlFor="reset-email"
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
                id="reset-email"
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
        </fieldset>

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending reset link...' : t.actions.sendResetLink}
        </Button>
      </form>
    </>
  );
}
