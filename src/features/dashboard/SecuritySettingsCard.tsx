import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, CheckCircle2, Eye, EyeOff, Lock} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {
  changePasswordFormSchema,
  type ChangePasswordFormParsed,
  type ChangePasswordFormValues,
} from '@/types/portal';

export function SecuritySettingsCard() {
  const {changePassword} = useAuth();
  const {t} = useLanguage();
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<ChangePasswordFormValues, unknown, ChangePasswordFormParsed>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {currentPassword: '', newPassword: '', confirmPassword: ''},
  });

  const onSubmit = async (values: ChangePasswordFormParsed) => {
    setPasswordSuccess(null);
    setPasswordError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      reset();
      setPasswordSuccess(t.settings.passwordUpdated);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to update password.');
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border card-inset p-6 space-y-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {t.settings.securitySection}
          </h3>
          <p className="text-xs text-muted mt-0.5">{t.settings.securityHint}</p>
        </div>
      </div>

      {passwordSuccess && (
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-text flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{passwordSuccess}</span>
        </div>
      )}

      {passwordError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{passwordError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="settings-current-pw"
            className="block text-[13px] font-semibold text-foreground mb-1.5"
          >
            {t.settings.currentPassword}
          </label>
          <div className="relative">
            <input
              id="settings-current-pw"
              type={showCurrentPw ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isSubmitting}
              {...register('currentPassword')}
              className={`w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border bg-surface text-sm text-foreground disabled:opacity-50 transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
                errors.currentPassword
                  ? 'border-danger focus:border-danger'
                  : 'border-border hover:border-border-strong focus:border-primary-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw((prev) => !prev)}
              aria-label={showCurrentPw ? 'Hide current password' : 'Show current password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              {showCurrentPw ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.currentPassword.message}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="settings-new-pw"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              {t.settings.newPassword}
            </label>
            <div className="relative">
              <input
                id="settings-new-pw"
                type={showNewPw ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register('newPassword')}
                className={`w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border bg-surface text-sm text-foreground disabled:opacity-50 transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
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
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.newPassword.message}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="settings-confirm-pw"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              {t.settings.confirmPassword}
            </label>
            <div className="relative">
              <input
                id="settings-confirm-pw"
                type={showConfirmPw ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register('confirmPassword')}
                className={`w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border bg-surface text-sm text-foreground disabled:opacity-50 transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
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
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.confirmPassword.message}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? t.settings.updatingPassword : t.settings.updatePassword}
          </Button>
        </div>
      </form>
    </div>
  );
}
