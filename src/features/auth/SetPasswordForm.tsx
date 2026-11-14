import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, Eye, EyeOff, KeyRound} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/Button';
import {useAuth} from '@/hooks/useAuth';
import {
  setNewPasswordFormSchema,
  type SetNewPasswordFormParsed,
  type SetNewPasswordFormValues,
} from '@/types/schemas';

export function SetPasswordForm({
  userEmail,
  onSuccess,
}: {
  userEmail: string;
  onSuccess: () => void;
}) {
  const {updateRecoveryPassword} = useAuth();
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<SetNewPasswordFormValues, unknown, SetNewPasswordFormParsed>({
    resolver: zodResolver(setNewPasswordFormSchema),
    defaultValues: {newPassword: '', confirmPassword: ''},
  });

  const onSubmit = async (values: SetNewPasswordFormParsed) => {
    setSubmitError(null);
    try {
      await updateRecoveryPassword(values.newPassword);
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to update your password. Please request a new reset link.',
      );
    }
  };

  return (
    <>
      <div className="mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
          <KeyRound className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-[22px] leading-[30px] font-bold tracking-tight text-foreground">
          Set new password
        </h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          Choose a new password for{' '}
          <span className="font-semibold text-foreground">
            {userEmail || 'your account'}
          </span>
          .
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-70">
          <div>
            <label
              htmlFor="reset-new-pw"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="reset-new-pw"
                type={showNewPw ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('newPassword')}
                placeholder="At least 8 characters"
                className={`w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors duration-150 focus:outline-none focus:ring-[3px] focus:ring-ring ${
                  errors.newPassword
                    ? 'border-danger focus:border-danger'
                    : 'border-border hover:border-border-strong focus:border-primary-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPw((prev) => !prev)}
                aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                {showNewPw ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.newPassword.message}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reset-confirm-pw"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="reset-confirm-pw"
                type={showConfirmPw ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                placeholder="Re-enter your new password"
                className={`w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors duration-150 focus:outline-none focus:ring-[3px] focus:ring-ring ${
                  errors.confirmPassword
                    ? 'border-danger focus:border-danger'
                    : 'border-border hover:border-border-strong focus:border-primary-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((prev) => !prev)}
                aria-label={showConfirmPw ? 'Hide confirmed password' : 'Show confirmed password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                {showConfirmPw ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.confirmPassword.message}</span>
              </p>
            )}
          </div>
        </fieldset>

        <Button type="submit" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Saving password...' : 'Save new password'}
        </Button>
      </form>
    </>
  );
}
