import {CheckCircle2, XCircle} from 'lucide-react';
import {Badge, Button, Card} from '@/components/ui';
import {
  SUBMISSION_STATUS_BADGE_CLASSES,
  SUBMISSION_STATUS_DOT_CLASSES,
  type InvoiceStatus,
} from '@/config/constants';
import type {InvoiceRecord, PaymentSubmissionRecord} from '@/types/portal';
import {formatBDT, formatDateTime} from '@/utils/format';

interface InvoicePaymentHistoryProps {
  invoice: InvoiceRecord;
  effectiveStatus: InvoiceStatus;
  paymentSubmissions: PaymentSubmissionRecord[];
  isAdmin: boolean;
  processingSubId: string | null;
  onVerifySubmission: (submission: PaymentSubmissionRecord) => void;
  onRequestReject: (submission: PaymentSubmissionRecord) => void;
}

export function InvoicePaymentHistory({
  invoice,
  effectiveStatus,
  paymentSubmissions,
  isAdmin,
  processingSubId,
  onVerifySubmission,
  onRequestReject,
}: InvoicePaymentHistoryProps) {
  return (
    <Card className="print:hidden overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">Payment History</h3>
          <p className="text-xs text-muted mt-0.5">
            All submitted bKash, Nagad, Bank, and admin-recorded payment entries for this invoice.
          </p>
        </div>
        <span className="text-xs font-semibold text-muted num">
          {paymentSubmissions.length} submission{paymentSubmissions.length === 1 ? '' : 's'}
        </span>
      </div>

      {effectiveStatus === 'Paid' && paymentSubmissions.length === 0 && (
        <div className="px-6 py-4 text-sm flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground num">
              {invoice.paymentMethod || 'Direct Payment'} · {formatBDT(invoice.amount)}
            </p>
            <p className="text-xs text-muted num mt-0.5">
              {invoice.paymentReference ? `Reference: ${invoice.paymentReference} · ` : ''}
              {invoice.paidAt ? `Recorded ${formatDateTime(invoice.paidAt)}` : 'Marked Paid'}
            </p>
          </div>
          <Badge dot tone="success">
            Paid
          </Badge>
        </div>
      )}

      {paymentSubmissions.length > 0 && (
        <ul className="divide-y divide-border">
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
                    <span className="font-semibold text-foreground num">
                      {sub.method || 'Payment'} ·{' '}
                      {formatBDT(Number.isFinite(sub.amountBdt) ? sub.amountBdt : 0)}
                    </span>
                    <Badge
                      dot
                      dotClassName={SUBMISSION_STATUS_DOT_CLASSES[sub.status]}
                      className={SUBMISSION_STATUS_BADGE_CLASSES[sub.status]}
                    >
                      {sub.status || 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted num">
                    TrxID:{' '}
                    <span className="font-mono font-semibold text-foreground">
                      {sub.transactionId || '—'}
                    </span>{' '}
                    · Sender: <span className="font-mono">{sub.senderNumber || '—'}</span> ·
                    Submitted {formatDateTime(sub.createdAt)}
                  </p>
                  {sub.status === 'Verified' && sub.verifiedAt && (
                    <p className="text-xs text-success-text num">
                      Verified {formatDateTime(sub.verifiedAt)}
                    </p>
                  )}
                  {sub.status === 'Rejected' && sub.rejectionReason && (
                    <p className="text-xs text-danger-text font-medium">
                      Rejection reason: {sub.rejectionReason}
                    </p>
                  )}
                </div>

                {isAdmin && sub.status === 'Pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {canAdminVerify && (
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        disabled={Boolean(processingSubId)}
                        loading={isBusy}
                        onClick={() => onVerifySubmission(sub)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                      >
                        {isBusy ? 'Verifying...' : 'Verify'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={Boolean(processingSubId)}
                      onClick={() => onRequestReject(sub)}
                      icon={<XCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
