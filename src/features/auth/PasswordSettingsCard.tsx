import {zodResolver} from '@hookform/resolvers/zod';
import {CheckCircle2, Eye, EyeOff, Lock} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Card, CardContent, Input} from '@/components/ui';
import {useAuth, useLanguage} from '@/hooks';
import {
  changePasswordFormSchema,
  type ChangePasswordFormParsed,
  type ChangePasswordFormValues,
} from '@/types/portal';

export function PasswordSettingsCard() {
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

  const onChangePassword = async (values: ChangePasswordFormParsed) => {
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

  const toggleButton = (shown: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
    >
      {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <Card>
      <CardContent className="space-y-5">
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

        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4" noValidate>
          <Input
            id="settings-current-pw"
            label={t.settings.currentPassword}
            type={showCurrentPw ? 'text' : 'password'}
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            rightSlot={toggleButton(
              showCurrentPw,
              () => setShowCurrentPw((p) => !p),
              showCurrentPw ? 'Hide current password' : 'Show current password',
            )}
            {...register('currentPassword')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="settings-new-pw"
              label={t.settings.newPassword}
              type={showNewPw ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.newPassword?.message}
              rightSlot={toggleButton(
                showNewPw,
                () => setShowNewPw((p) => !p),
                showNewPw ? 'Hide new password' : 'Show new password',
              )}
              {...register('newPassword')}
            />
            <Input
              id="settings-confirm-pw"
              label={t.settings.confirmPassword}
              type={showConfirmPw ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              rightSlot={toggleButton(
                showConfirmPw,
                () => setShowConfirmPw((p) => !p),
                showConfirmPw ? 'Hide confirmed password' : 'Show confirmed password',
              )}
              {...register('confirmPassword')}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? t.settings.updatingPassword : t.settings.updatePassword}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
