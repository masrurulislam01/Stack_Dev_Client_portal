import {Check, Copy, MailPlus, X} from 'lucide-react';
import {useState} from 'react';
import type {ClientInviteInfo} from '@/features/clients/inviteHelpers';

export interface ClientInviteBannerProps {
  inviteInfo: ClientInviteInfo;
  onDismiss: () => void;
  onCopyError: (msg: string) => void;
}

export function ClientInviteBanner({
  inviteInfo,
  onDismiss,
  onCopyError,
}: ClientInviteBannerProps) {
  const [copiedField, setCopiedField] = useState<'invite' | 'sql' | null>(null);

  const copyText = async (text: string, field: 'invite' | 'sql') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      onCopyError('Clipboard access was denied. Please copy the text manually.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
          <MailPlus className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold">
              Invite ready for {inviteInfo.name} ({inviteInfo.email})
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Client row saved. Copy the invite message for the client and create/link their Auth
              user in Supabase Dashboard.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss invite panel"
          className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              1. Copyable Message for Client
            </span>
            <button
              type="button"
              onClick={() => void copyText(inviteInfo.inviteMessage, 'invite')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              {copiedField === 'invite' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy message</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
            {inviteInfo.inviteMessage}
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              2. Link Profile After Adding User in Supabase Dashboard
            </span>
            <button
              type="button"
              onClick={() => void copyText(inviteInfo.linkSqlSnippet, 'sql')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              {copiedField === 'sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
            {inviteInfo.linkSqlSnippet}
          </pre>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            In Supabase Dashboard → Authentication → Users → Add user (check Auto Confirm User),
            then run the SQL above in the SQL Editor.
          </p>
        </div>
      </div>
    </div>
  );
}
