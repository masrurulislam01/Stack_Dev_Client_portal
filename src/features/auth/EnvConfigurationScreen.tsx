import {AlertTriangle, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui';

export function EnvConfigurationScreen({error}: {error: Error}) {
  const issues = error.message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-12">
      <div
        role="alert"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Supabase Configuration Required
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your environment variables in Secrets or .env
            </p>
          </div>
        </div>

        <ul className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs sm:text-sm text-red-700 dark:text-red-300 space-y-2 list-disc list-inside break-words">
          {issues.map((issue, idx) => (
            <li key={idx}>{issue}</li>
          ))}
        </ul>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            Where to copy these in Supabase Dashboard:
          </p>
          <ul className="space-y-1.5 font-mono text-[11px]">
            <li>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                VITE_SUPABASE_URL
              </span>
              =https://&lt;your-project-ref&gt;.supabase.co{' '}
              <span className="font-sans text-slate-500">(Settings → Data API / General)</span>
            </li>
            <li>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                VITE_SUPABASE_ANON_KEY
              </span>
              =sb_publishable_...{' '}
              <span className="font-sans text-slate-500">
                (Settings → API Keys → Publishable key; never sb_secret_ or service_role)
              </span>
            </li>
          </ul>
        </div>

        <Button
          onClick={() => window.location.reload()}
          leftIcon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
          className="w-full"
        >
          Reload App
        </Button>
      </div>
    </div>
  );
}
