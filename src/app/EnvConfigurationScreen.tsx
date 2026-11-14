import {AlertTriangle, RefreshCw} from 'lucide-react';

export function EnvConfigurationScreen({error}: {error: Error}) {
  const issues = error.message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-body flex items-center justify-center px-4 py-12">
      <div
        role="alert"
        className="w-full max-w-lg bg-surface rounded-3xl border border-border shadow-lg p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-danger-soft text-danger-text flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-foreground">
              Supabase Configuration Required
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Update your environment variables in Secrets or .env
            </p>
          </div>
        </div>

        <ul className="px-4 py-3 rounded-xl bg-danger-soft border border-danger/30 text-xs sm:text-sm text-danger-text space-y-2 list-disc list-inside break-words">
          {issues.map((issue, idx) => (
            <li key={idx}>{issue}</li>
          ))}
        </ul>

        <div className="rounded-xl bg-surface-muted border border-border p-4 space-y-2 text-xs text-body">
          <p className="font-semibold text-foreground">
            Where to copy these in Supabase Dashboard:
          </p>
          <ul className="space-y-1.5 font-mono text-[11px]">
            <li>
              <span className="font-semibold text-primary-600">VITE_SUPABASE_URL</span>
              =https://&lt;your-project-ref&gt;.supabase.co{' '}
              <span className="font-sans text-muted">(Settings → Data API / General)</span>
            </li>
            <li>
              <span className="font-semibold text-primary-600">VITE_SUPABASE_ANON_KEY</span>
              =sb_publishable_...{' '}
              <span className="font-sans text-muted">
                (Settings → API Keys → Publishable key; never sb_secret_ or service_role)
              </span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold shadow-xs hover:brightness-110 hover:shadow-brand transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Reload App</span>
        </button>
      </div>
    </div>
  );
}
