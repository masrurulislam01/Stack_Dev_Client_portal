import {ArrowLeft} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';

export function NotFoundPage() {
  const {user} = useAuth();
  const {t} = useLanguage();

  const homePath = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : '/dashboard'
    : '/login';

  return (
    <div className="min-h-screen bg-background text-body flex items-center justify-center px-4 py-12">
      <main className="w-full max-w-md bg-surface rounded-3xl border border-border shadow-md p-8 sm:p-10 text-center space-y-5">
        <p
          aria-hidden="true"
          className="font-heading text-7xl sm:text-8xl font-extrabold tracking-tight text-primary-200 leading-none select-none num"
        >
          {t.notFound.code}
        </p>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {t.notFound.title}
          </h1>
          <p className="text-sm text-muted leading-relaxed">{t.notFound.description}</p>
        </div>

        <div className="pt-1">
          <Link
            to={homePath}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:brightness-110 hover:shadow-brand transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{user ? t.notFound.goHome : t.notFound.goLogin}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
