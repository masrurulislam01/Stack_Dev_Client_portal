import {AlertTriangle, ArrowLeft} from 'lucide-react';
import {Link} from 'react-router-dom';

export function RecoveryErrorCard({linkError}: {linkError: string | null}) {
  return (
    <div className="text-center space-y-5">
      <div className="w-12 h-12 rounded-xl bg-warning-soft text-warning-text flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Reset link invalid or expired
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          {linkError ||
            'Your password reset session is no longer active. Request a fresh password reset link from the login page.'}
        </p>
      </div>
      <Link
        to="/login"
        className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:brightness-110 hover:shadow-brand transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to Sign In</span>
      </Link>
    </div>
  );
}
