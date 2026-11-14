import {zodResolver} from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Moon,
  Sun,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {AuthLoadingSkeleton} from '../components/AuthLoadingSkeleton';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {useTheme} from '../context/ThemeContext';
import {
  setNewPasswordFormSchema,
  type SetNewPasswordFormParsed,
  type SetNewPasswordFormValues,
} from '../types/portal';

function extractRecoveryLinkError(search: string, hash: string): string | null {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

  const errorCode =
    searchParams.get('error_code') || hashParams.get('error_code');
  const errorDesc =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error');

  if (!errorCode && !errorDesc) {
    return null;
  }

  if (errorCode === 'otp_expired') {
    return 'This password reset link has expired or was already used. Please request a new reset link.';
  }

  return errorDesc
    ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
    : 'This password reset link is invalid or has expired.';
}

export function SetNewPasswordPage() {
  const {user, profile, loading, updateRecoveryPassword} = useAuth();
  const {theme, toggleTheme} = useTheme();
  const {language, toggleLanguage, t} = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const linkError = useMemo(
    () => extractRecoveryLinkError(location.search, location.hash),
    [location.search, location.hash],
  );

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<SetNewPasswordFormValues, unknown, SetNewPasswordFormParsed>({
    resolver: zodResolver(setNewPasswordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  if (loading && !linkError) {
    return <AuthLoadingSkeleton />;
  }

  const role = profile?.role ?? user?.role;
  const dashboardPath = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  const onSubmit = async (values: SetNewPasswordFormParsed) => {
    setSubmitError(null);
    try {
      await updateRecoveryPassword(values.newPassword);
      setCompleted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to update your password. Please request a new reset link.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3">
        <span className="text-xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
          Stack Dev
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t.topbar.switchLanguage}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? t.topbar.switchToLight : t.topbar.switchToDark
            }
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Centered Card */}
      <main className="w-full max-w-md mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          {completed ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Password updated
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your new password has been saved and your portal session is active.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(user ? dashboardPath : '/login', {replace: true})}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {user ? 'Continue to Portal' : 'Sign in'}
              </button>
            </div>
          ) : linkError || !user ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Reset link invalid or expired
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {linkError ||
                    'Your password reset session is no longer active. Request a fresh password reset link from the login page.'}
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          ) : (
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
                    {user.email}
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
                      aria-label={
                        showConfirmPw
                          ? 'Hide confirmed password'
                          : 'Show confirmed password'
                      }
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  {isSubmitting ? 'Saving password...' : 'Save new password'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto text-center text-xs text-slate-600 dark:text-slate-400">
        <span>Stack Dev</span>
        <span aria-hidden="true"> · </span>
        <span>Web &amp; Flutter Studio, Dhaka, Bangladesh</span>
      </footer>
    </div>
  );
}
