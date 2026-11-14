import {CheckCircle2, XCircle} from 'lucide-react';
import {
  formatBDT,
  PAYMENT_SUBMISSION_BADGE_CLASSES,
} from '@/lib/constants';
import type {
  InvoiceRecord,
  InvoiceStatus,
  PaymentSubmissionRecord,
} from '@/types/portal';
import {formatDateTime} from '@/utils/format';

interface InvoicePaymentHistoryProps {
  invoice: InvoiceRecord;
  effectiveStatus: InvoiceStatus;
  paymentSubmissions: PaymentSubmissionRecord[];
  isAdmin: boolean;
  processingSubId: string | null;
  onVerify: (submission: PaymentSubmissionRecord) => void;
  onReject: (submission: PaymentSubmissionRecord) => void;
}

export function InvoicePaymentHistory({
  invoice,
  effectiveStatus,
  paymentSubmissions,
  isAdmin,
  processingSubId,
  onVerify,
  onReject,
}: InvoicePaymentHistoryProps) {
  if (paymentSubmissions.length === 0 && effectiveStatus !== 'Paid') {
    return null;
  }

  return (
    <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Payment History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All submitted bKash, Nagad, Bank, and admin-recorded payment entries for this invoice.
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {paymentSubmissions.length} submission{paymentSubmissions.length === 1 ? '' : 's'}
        </span>
      </div>

      {effectiveStatus === 'Paid' && paymentSubmissions.length === 0 && (
        <div className="px-6 py-4 text-sm flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {invoice.paymentMethod || 'Direct Payment'} · {formatBDT(invoice.amount)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
              {invoice.paymentReference ? `Reference: ${invoice.paymentReference} · ` : ''}
              {invoice.paidAt ? `Recorded ${formatDateTime(invoice.paidAt)}` : 'Marked Paid'}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60">
            Paid
          </span>
        </div>
      )}

      {paymentSubmissions.length > 0 && (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {paymentSubmissions.map((sub) => {
            const isBusy = processingSubId === sub.id;
            const canAdminVerify =
              isAdmin && sub.status === 'Pending' && effectiveStatus !== 'Paid';

            return (
              <li
                key={sub.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {sub.method} · {formatBDT(sub.amountBdt)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PAYMENT_SUBMISSION_BADGE_CLASSES[sub.status]}`}
                    >
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    TrxID:{' '}
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {sub.transactionId}
                    </span>{' '}
                    · Sender: <span className="font-mono">{sub.senderNumber}</span> · Submitted{' '}
                    {formatDateTime(sub.createdAt)}
                  </p>
                  {sub.status === 'Verified' && sub.verifiedAt && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                      Verified {formatDateTime(sub.verifiedAt)}
                    </p>
                  )}
                  {sub.status === 'Rejected' && sub.rejectionReason && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Rejection reason: {sub.rejectionReason}
                    </p>
                  )}
                </div>

                {isAdmin && sub.status === 'Pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {canAdminVerify && (
                      <button
                        type="button"
                        disabled={Boolean(processingSubId)}
                        onClick={() => onVerify(sub)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isBusy ? 'Verifying...' : 'Verify'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={Boolean(processingSubId)}
                      onClick={() => onReject(sub)}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-xs font-semibold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
