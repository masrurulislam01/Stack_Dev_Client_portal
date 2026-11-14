import {AlertCircle} from 'lucide-react';
import {useState} from 'react';
import {Card} from '@/components/ui';
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

  const submissions = existingSubmissions ?? [];
  const pendingSubmissions = submissions.filter((s) => s.status === 'Pending');
  const latestRejected = submissions.find((s) => s.status === 'Rejected');
  const isUnderReview = pendingSubmissions.length > 0;
  const showForm = !isUnderReview || showExtraForm;
  const safeAmount = Number.isFinite(invoice.amount) ? invoice.amount : 0;
  const amountText = formatBDT(safeAmount);
  const safeInvoiceNumber = invoice.invoiceNumber || 'Invoice';

  return (
    <Card
      id="pay-now"
      aria-labelledby="pay-now-heading"
      className="print:hidden overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 id="pay-now-heading" className="font-heading text-lg font-semibold text-foreground">
            Pay Now
          </h3>
          <p className="text-xs sm:text-sm text-muted mt-0.5 num">
            Send {amountText} to Stack Dev via bKash, Nagad, or Bank transfer, then submit your Transaction ID for verification.
          </p>
        </div>

        <span className="font-heading text-base font-bold text-primary-600 num whitespace-nowrap">
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
            className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-danger-text"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                Previous submission ({latestRejected.method || 'Payment'} · TrxID:{' '}
                <span className="font-mono">{latestRejected.transactionId || '—'}</span>) was rejected
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
              invoiceNumber={safeInvoiceNumber}
              selectedMethod={selectedMethod}
            />
            <PaymentProofForm
              invoiceId={invoice.id}
              invoiceAmount={safeAmount}
              existingSubmissions={submissions}
              selectedMethod={selectedMethod}
              onMethodChange={setSelectedMethod}
              onSubmitProof={onSubmitProof}
              onSuccessReset={() => setShowExtraForm(false)}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
