import {zodResolver} from '@hookform/resolvers/zod';
import {CheckCircle2, Eye, EyeOff, Lock} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.settings.securitySection}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t.settings.securityHint}
          </p>
        </div>
      </div>

      {passwordSuccess && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{passwordSuccess}</span>
        </div>
      )}

      {passwordError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {passwordError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="settings-current-pw"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {t.settings.currentPassword}
          </label>
          <div className="relative">
            <input
              id="settings-current-pw"
              type={showCurrentPw ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('currentPassword')}
              className="w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw((prev) => !prev)}
              aria-label={showCurrentPw ? 'Hide current password' : 'Show current password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {showCurrentPw ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="settings-new-pw"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {t.settings.newPassword}
            </label>
            <div className="relative">
              <input
                id="settings-new-pw"
                type={showNewPw ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('newPassword')}
                className="w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((prev) => !prev)}
                aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {showNewPw ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="settings-confirm-pw"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {t.settings.confirmPassword}
            </label>
            <div className="relative">
              <input
                id="settings-confirm-pw"
                type={showConfirmPw ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((prev) => !prev)}
                aria-label={showConfirmPw ? 'Hide confirmed password' : 'Show confirmed password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {showConfirmPw ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {isSubmitting ? t.settings.updatingPassword : t.settings.updatePassword}
          </button>
        </div>
      </form>
    </div>
  );
}
