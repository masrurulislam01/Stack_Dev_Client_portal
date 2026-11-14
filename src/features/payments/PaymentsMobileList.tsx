import {CheckCircle2, XCircle} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge, Button} from '@/components/ui';
import {
  SUBMISSION_STATUS_BADGE_CLASSES,
  SUBMISSION_STATUS_DOT_CLASSES,
} from '@/config/constants';
import type {PaymentSubmissionRecord} from '@/types/portal';
import {formatBDT, formatDateTime} from '@/utils/format';

interface PaymentsMobileListProps {
  submissions: PaymentSubmissionRecord[];
  processingId: string | null;
  onVerify: (submission: PaymentSubmissionRecord) => void;
  onReject: (submission: PaymentSubmissionRecord) => void;
}

export function PaymentsMobileList({
  submissions,
  processingId,
  onVerify,
  onReject,
}: PaymentsMobileListProps) {
  return (
    <ul className="lg:hidden divide-y divide-border">
      {submissions.map((sub) => {
        const isBusy = processingId === sub.id;
        const invoiceAlreadyPaid = sub.invoiceStatus === 'Paid';
        const canAct = sub.status === 'Pending' && !invoiceAlreadyPaid;
        const safeAmount = Number.isFinite(sub.amountBdt) ? sub.amountBdt : 0;
        const badgeClass = SUBMISSION_STATUS_BADGE_CLASSES[sub.status];
        const dotClass = SUBMISSION_STATUS_DOT_CLASSES[sub.status];

        return (
          <li key={sub.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/invoices/${sub.invoiceId}`}
                  className="font-mono text-sm font-semibold text-primary-600 hover:underline num focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded-md"
                >
                  {sub.invoiceNumber || 'Invoice'}
                </Link>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {sub.clientName || 'Client'}
                  {sub.projectTitle ? ` · ${sub.projectTitle}` : ''}
                </p>
              </div>

              <Badge dot dotClassName={dotClass} className={badgeClass}>
                {sub.status || 'Pending'}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <dt className="text-muted">Method &amp; Amount</dt>
                <dd className="font-semibold text-foreground num mt-0.5">
                  {sub.method || 'Payment'} · {formatBDT(safeAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Sender</dt>
                <dd className="font-mono text-body num mt-0.5">{sub.senderNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted">Transaction ID</dt>
                <dd className="font-mono font-semibold text-foreground mt-0.5">
                  {sub.transactionId || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Submitted</dt>
                <dd className="text-body num mt-0.5">{formatDateTime(sub.createdAt)}</dd>
              </div>
            </dl>

            {sub.status === 'Rejected' && sub.rejectionReason && (
              <p className="text-xs text-danger-text">Reason: {sub.rejectionReason}</p>
            )}

            {canAct && (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="success"
                  loading={isBusy}
                  disabled={Boolean(processingId)}
                  onClick={() => onVerify(sub)}
                  icon={<CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                  className="flex-1"
                >
                  {isBusy ? 'Verifying...' : 'Verify'}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={Boolean(processingId)}
                  onClick={() => onReject(sub)}
                  icon={<XCircle className="w-4 h-4" aria-hidden="true" />}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
