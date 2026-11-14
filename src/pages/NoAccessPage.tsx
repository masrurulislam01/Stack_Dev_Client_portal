import {ArrowLeft, LogOut, ShieldAlert} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

export function NoAccessPage() {
  const {user, profile, signOut} = useAuth();
  const navigate = useNavigate();

  const role = profile?.role ?? user?.role;
  const homePath = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', {replace: true});
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-12">
      <main className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Access Restricted
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            No access
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Your account does not have permission to view this page.
            {user?.email ? (
              <>
                {' '}
                Signed in as{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {user.email}
                </span>{' '}
                ({role === 'admin' ? 'Admin' : 'Client'}).
              </>
            ) : null}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? homePath : '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{user ? 'Go to Dashboard' : 'Back to Sign In'}</span>
          </Link>

          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
