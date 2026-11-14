import {AlertCircle} from 'lucide-react';
import {useState} from 'react';
import type {PaymentSubmissionMethod} from '@/config/constants';
import {PaymentInstructionsCard} from '@/features/payments/PaymentInstructionsCard';
import {PaymentProofForm} from '@/features/payments/PaymentProofForm';
import {PendingReviewBanner} from '@/features/payments/PendingReviewBanner';
import type {
  InvoiceRecord,
  PaymentSubmissionFormParsed,
  PaymentSubmissionRecord,
} from '@/types/portal';
import {formatBDT} from '@/utils/format';

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
          <PendingReviewBanner
            pendingSubmissions={pendingSubmissions}
            showExtraForm={showExtraForm}
            onToggleExtraForm={() => setShowExtraForm((prev) => !prev)}
          />
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
            <PaymentInstructionsCard
              amountText={amountText}
              invoiceNumber={invoice.invoiceNumber}
              selectedMethod={selectedMethod}
            />
            <PaymentProofForm
              invoiceId={invoice.id}
              invoiceAmount={invoice.amount}
              existingSubmissions={existingSubmissions}
              selectedMethod={selectedMethod}
              onMethodChange={setSelectedMethod}
              onSubmitProof={onSubmitProof}
              onSuccessReset={() => setShowExtraForm(false)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
