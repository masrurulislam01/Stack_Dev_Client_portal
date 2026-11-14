import {ArrowLeft, LogOut, ShieldAlert} from 'lucide-react';
import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/Button';
import {useAuth} from '@/hooks/useAuth';

export function NoAccessPage() {
  const {user, profile, signOut} = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const role = profile?.role ?? user?.role;
  const homePath = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login', {replace: true});
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-body flex items-center justify-center px-4 py-12">
      <main className="w-full max-w-md bg-surface rounded-3xl border border-border shadow-md p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-xl bg-warning-soft text-warning-text flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-warning-text">
            Access Restricted
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            No access
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Your account does not have permission to view this page.
            {user?.email ? (
              <>
                {' '}
                Signed in as{' '}
                <span className="font-semibold text-foreground">{user.email}</span> (
                {role === 'admin' ? 'Admin' : 'Client'}).
              </>
            ) : null}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? homePath : '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:brightness-110 hover:shadow-brand transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{user ? 'Go to Dashboard' : 'Back to Sign In'}</span>
          </Link>

          {user && (
            <Button
              variant="secondary"
              loading={signingOut}
              icon={<LogOut className="w-4 h-4" aria-hidden="true" />}
              onClick={() => void handleSignOut()}
              className="w-full sm:w-auto"
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
