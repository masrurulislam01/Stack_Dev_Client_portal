import {Check, Copy, MailPlus, X} from 'lucide-react';
import type {ClientInviteInfo} from '@/features/clients/inviteHelpers';
import {useCopyToClipboard} from '@/hooks/useCopyToClipboard';

interface ClientInviteCardProps {
  inviteInfo: ClientInviteInfo;
  onDismiss: () => void;
  onCopyError: (message: string) => void;
}

export function ClientInviteCard({inviteInfo, onDismiss, onCopyError}: ClientInviteCardProps) {
  const {copiedKey, copy} = useCopyToClipboard<'invite' | 'sql'>();

  const handleCopy = async (text: string, key: 'invite' | 'sql') => {
    const ok = await copy(text, key);
    if (!ok) {
      onCopyError('Clipboard access was denied. Please copy the text manually.');
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-success/30 card-inset p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-soft text-success-text flex items-center justify-center shrink-0">
            <MailPlus className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Invite ready for {inviteInfo.name} ({inviteInfo.email})
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Client row saved. Copy the invite message for the client and create/link their Auth
              user in Supabase Dashboard.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss invite panel"
          className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-foreground hover:bg-surface-muted cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted">
              1. Copyable Message for Client
            </span>
            <button
              type="button"
              onClick={() => void handleCopy(inviteInfo.inviteMessage, 'invite')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
            >
              {copiedKey === 'invite' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success-text" aria-hidden="true" />
                  <span className="text-success-text">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy message</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-surface-muted border border-border text-xs text-body whitespace-pre-wrap font-sans leading-relaxed">
            {inviteInfo.inviteMessage}
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted">
              2. Link Profile After Adding User in Supabase Dashboard
            </span>
            <button
              type="button"
              onClick={() => void handleCopy(inviteInfo.linkSqlSnippet, 'sql')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
            >
              {copiedKey === 'sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success-text" aria-hidden="true" />
                  <span className="text-success-text">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-surface-muted border border-border text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
            {inviteInfo.linkSqlSnippet}
          </pre>
          <p className="mt-1.5 text-[11px] text-muted">
            In Supabase Dashboard → Authentication → Users → Add user (check Auto Confirm User),
            then run the SQL above in the SQL Editor.
          </p>
        </div>
      </div>
    </div>
  );
}
