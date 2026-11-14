import {AlertCircle, Clock} from 'lucide-react';
import {useState} from 'react';
import {PaymentChannelsCard} from '@/features/payments/PaymentChannelsCard';
import {PayNowForm} from '@/features/payments/PayNowForm';
import {formatBDT} from '@/lib/constants';
import type {
  InvoiceRecord,
  PaymentSubmissionFormParsed,
  PaymentSubmissionMethod,
  PaymentSubmissionRecord,
} from '@/types/portal';
import {formatDateTime} from '@/utils/format';

interface PayNowPanelProps {
  invoice: InvoiceRecord;
  existingSubmissions: PaymentSubmissionRecord[];
  onSubmitProof: (values: PaymentSubmissionFormParsed) => Promise<void>;
}

export function PayNowPanel({
  invoice,
  existingSubmissions,
  onSubmitProof,
}: PayNowPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentSubmissionMethod>('bKash');
  const [showExtraForm, setShowExtraForm] = useState(false);

  const pendingSubmissions = existingSubmissions.filter((s) => s.status === 'Pending');
  const latestRejected = existingSubmissions.find((s) => s.status === 'Rejected');
  const isUnderReview = pendingSubmissions.length > 0;
  const showForm = !isUnderReview || showExtraForm;
  const amountText = formatBDT(invoice.amount);

  return (
    <section
      id="pay-now"
      aria-labelledby="pay-now-heading"
      className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3
            id="pay-now-heading"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Pay Now
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Send {amountText} to Stack Dev via bKash, Nagad, or Bank transfer, then submit your Transaction ID for verification.
          </p>
        </div>

        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 tabular-nums whitespace-nowrap">
          Due: {amountText}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {isUnderReview && (
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
                onClick={() => setShowExtraForm((prev) => !prev)}
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
        )}

        {!isUnderReview && latestRejected && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                Previous submission ({latestRejected.method} · TrxID: {latestRejected.transactionId}) was rejected
              </p>
              {latestRejected.rejectionReason && (
                <p className="mt-0.5">Reason: {latestRejected.rejectionReason}</p>
              )}
            </div>
          </div>
        )}

        {showForm && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <PaymentChannelsCard
              invoiceNumber={invoice.invoiceNumber}
              amountText={amountText}
              selectedMethod={selectedMethod}
            />

            <PayNowForm
              invoiceId={invoice.id}
              invoiceAmount={invoice.amount}
              existingSubmissions={existingSubmissions}
              selectedMethod={selectedMethod}
              onMethodChange={setSelectedMethod}
              onSubmitProof={onSubmitProof}
              onSubmitted={() => setShowExtraForm(false)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
