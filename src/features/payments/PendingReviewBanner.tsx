import {Clock} from 'lucide-react';
import type {PaymentSubmissionRecord} from '@/types/portal';
import {formatBDT, formatDateTime} from '@/utils/format';

interface PendingReviewBannerProps {
  pendingSubmissions: PaymentSubmissionRecord[];
  showExtraForm: boolean;
  onToggleExtraForm: () => void;
}

export function PendingReviewBanner({
  pendingSubmissions,
  showExtraForm,
  onToggleExtraForm,
}: PendingReviewBannerProps) {
  return (
    <div
      role="status"
      className="rounded-xl border border-warning/30 bg-warning-soft p-4 space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-warning-text shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Payment under review</p>
            <p className="text-xs text-warning-text leading-relaxed">
              We have received your payment details and notified Stack Dev. Your invoice status will update to Paid once verified.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExtraForm}
          className="inline-flex items-center justify-center min-h-[38px] px-3.5 py-1.5 rounded-xl border border-warning/30 bg-surface text-xs font-semibold text-warning-text hover:bg-surface-muted transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {showExtraForm ? 'Hide payment form' : 'Submit another TrxID'}
        </button>
      </div>

      <ul className="divide-y divide-warning/20 border-t border-warning/20 pt-2">
        {pendingSubmissions.map((sub) => (
          <li
            key={sub.id}
            className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground"
          >
            <span className="font-medium num">
              {sub.method} · {formatBDT(sub.amountBdt)} · TrxID:{' '}
              <span className="font-mono font-semibold">{sub.transactionId}</span> · From{' '}
              <span className="font-mono">{sub.senderNumber}</span>
            </span>
            <span className="text-warning-text num">
              Submitted {formatDateTime(sub.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
