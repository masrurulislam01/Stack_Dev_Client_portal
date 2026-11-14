import {zodResolver} from '@hookform/resolvers/zod';
import {Eye, EyeOff, KeyRound} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
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
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <KeyRound className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Set new password
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          Choose a new password for{' '}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {userEmail}
          </span>
          .
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="reset-new-pw"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="reset-new-pw"
              type={showNewPw ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('newPassword')}
              placeholder="At least 6 characters"
              className="w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
            <button
              type="button"
              onClick={() => setShowNewPw((prev) => !prev)}
              aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {showNewPw ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
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
            htmlFor="reset-confirm-pw"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
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
              className="w-full min-h-[44px] pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw((prev) => !prev)}
              aria-label={showConfirmPw ? 'Hide confirmed password' : 'Show confirmed password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {showConfirmPw ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          {isSubmitting ? 'Saving password...' : 'Save new password'}
        </button>
      </form>
    </>
  );
}
