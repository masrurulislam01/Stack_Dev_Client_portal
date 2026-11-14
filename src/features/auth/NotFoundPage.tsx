import {ArrowLeft, FileQuestion} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth, useLanguage} from '@/hooks';

export function NotFoundPage() {
  const {user} = useAuth();
  const {t} = useLanguage();

  const homePath = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : '/dashboard'
    : '/login';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-12">
      <main className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 tabular-nums">
            {t.notFound.code}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.notFound.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.notFound.description}
          </p>
        </div>

        <div className="pt-1">
          <Link
            to={homePath}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{user ? t.notFound.goHome : t.notFound.goLogin}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
