import {CheckCircle2, ExternalLink, XCircle} from 'lucide-react';
import {Link} from 'react-router-dom';
import {formatBDT, PAYMENT_SUBMISSION_BADGE_CLASSES} from '@/lib/constants';
import type {PaymentSubmissionRecord} from '@/types/portal';
import {formatDateTime} from '@/utils/format';

interface PaymentsVerificationTableProps {
  submissions: PaymentSubmissionRecord[];
  processingId: string | null;
  onVerify: (submission: PaymentSubmissionRecord) => void;
  onReject: (submission: PaymentSubmissionRecord) => void;
}

export function PaymentsVerificationTable({
  submissions,
  processingId,
  onVerify,
  onReject,
}: PaymentsVerificationTableProps) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
            <th className="py-3 px-6">Invoice</th>
            <th className="py-3 px-4">Client</th>
            <th className="py-3 px-4">Method</th>
            <th className="py-3 px-4">Sender Number</th>
            <th className="py-3 px-4">TrxID</th>
            <th className="py-3 px-4 text-right">Amount</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          {submissions.map((sub) => {
            const isBusy = processingId === sub.id;
            const invoiceAlreadyPaid = sub.invoiceStatus === 'Paid';
            const canAct = sub.status === 'Pending' && !invoiceAlreadyPaid;

            return (
              <tr
                key={sub.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3.5 px-6 whitespace-nowrap">
                  <Link
                    to={`/invoices/${sub.invoiceId}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tabular-nums"
                  >
                    <span>{sub.invoiceNumber || 'Invoice'}</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatDateTime(sub.createdAt)}
                  </p>
                </td>

                <td className="py-3.5 px-4">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{sub.clientName}</p>
                  {sub.projectTitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                      {sub.projectTitle}
                    </p>
                  )}
                </td>

                <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {sub.method}
                </td>

                <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                  {sub.senderNumber}
                </td>

                <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                  {sub.transactionId}
                </td>

                <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                  {formatBDT(sub.amountBdt)}
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PAYMENT_SUBMISSION_BADGE_CLASSES[sub.status]}`}
                  >
                    {sub.status}
                  </span>
                  {sub.status === 'Rejected' && sub.rejectionReason && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 max-w-[200px]">
                      {sub.rejectionReason}
                    </p>
                  )}
                </td>

                <td className="py-3.5 px-6 text-right whitespace-nowrap">
                  {canAct ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        disabled={Boolean(processingId)}
                        onClick={() => onVerify(sub)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isBusy ? 'Verifying...' : 'Verify'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(processingId)}
                        onClick={() => onReject(sub)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : sub.status === 'Pending' && invoiceAlreadyPaid ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Invoice already Paid
                      </span>
                      <button
                        type="button"
                        disabled={Boolean(processingId)}
                        onClick={() => onReject(sub)}
                        className="inline-flex items-center gap-1 min-h-[32px] px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 text-xs font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={`/invoices/${sub.invoiceId}`}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Invoice
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
