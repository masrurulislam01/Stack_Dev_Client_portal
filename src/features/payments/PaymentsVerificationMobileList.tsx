import {CheckCircle2, XCircle} from 'lucide-react';
import {Link} from 'react-router-dom';
import {formatBDT, PAYMENT_SUBMISSION_BADGE_CLASSES} from '@/lib/constants';
import type {PaymentSubmissionRecord} from '@/types/portal';
import {formatDateTime} from '@/utils/format';

interface PaymentsVerificationMobileListProps {
  submissions: PaymentSubmissionRecord[];
  processingId: string | null;
  onVerify: (submission: PaymentSubmissionRecord) => void;
  onReject: (submission: PaymentSubmissionRecord) => void;
}

export function PaymentsVerificationMobileList({
  submissions,
  processingId,
  onVerify,
  onReject,
}: PaymentsVerificationMobileListProps) {
  return (
    <ul className="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
      {submissions.map((sub) => {
        const isBusy = processingId === sub.id;
        const invoiceAlreadyPaid = sub.invoiceStatus === 'Paid';
        const canAct = sub.status === 'Pending' && !invoiceAlreadyPaid;

        return (
          <li key={sub.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/invoices/${sub.invoiceId}`}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tabular-nums"
                >
                  {sub.invoiceNumber || 'Invoice'}
                </Link>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {sub.clientName}
                  {sub.projectTitle ? ` · ${sub.projectTitle}` : ''}
                </p>
              </div>

              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 ${PAYMENT_SUBMISSION_BADGE_CLASSES[sub.status]}`}
              >
                {sub.status}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Method &amp; Amount</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {sub.method} · {formatBDT(sub.amountBdt)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Sender</dt>
                <dd className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                  {sub.senderNumber}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Transaction ID</dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {sub.transactionId}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Submitted</dt>
                <dd className="text-slate-600 dark:text-slate-300 tabular-nums">
                  {formatDateTime(sub.createdAt)}
                </dd>
              </div>
            </dl>

            {sub.status === 'Rejected' && sub.rejectionReason && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Reason: {sub.rejectionReason}
              </p>
            )}

            {canAct && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={Boolean(processingId)}
                  onClick={() => onVerify(sub)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isBusy ? 'Verifying...' : 'Verify'}</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(processingId)}
                  onClick={() => onReject(sub)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-xs font-semibold"
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
  );
}
