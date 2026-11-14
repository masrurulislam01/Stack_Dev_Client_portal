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
      className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Clock
            className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Payment under review
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              We have received your payment details and notified Stack Dev. Your invoice status will update to Paid once verified.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExtraForm}
          className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 transition-colors whitespace-nowrap shrink-0"
        >
          {showExtraForm ? 'Hide payment form' : 'Submit another TrxID'}
        </button>
      </div>

      <ul className="divide-y divide-amber-200/70 dark:divide-amber-900/40 border-t border-amber-200/70 dark:border-amber-900/40 pt-2">
        {pendingSubmissions.map((sub) => (
          <li
            key={sub.id}
            className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200"
          >
            <span className="font-medium tabular-nums">
              {sub.method} · {formatBDT(sub.amountBdt)} · TrxID:{' '}
              <span className="font-mono">{sub.transactionId}</span> · From {sub.senderNumber}
            </span>
            <span className="text-amber-700 dark:text-amber-300 tabular-nums">
              Submitted {formatDateTime(sub.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
