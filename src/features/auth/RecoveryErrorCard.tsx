import {AlertTriangle, ArrowLeft} from 'lucide-react';
import {Link} from 'react-router-dom';

export function RecoveryErrorCard({linkError}: {linkError: string | null}) {
  return (
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
  );
}
