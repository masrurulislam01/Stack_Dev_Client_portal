import {CheckCircle2, ExternalLink, XCircle} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge, Button, TableHead, TableHeaderCell} from '@/components/ui';
import {
  SUBMISSION_STATUS_BADGE_CLASSES,
  SUBMISSION_STATUS_DOT_CLASSES,
} from '@/config/constants';
import type {PaymentSubmissionRecord} from '@/types/portal';
import {formatBDT, formatDateTime} from '@/utils/format';

interface PaymentsTableProps {
  submissions: PaymentSubmissionRecord[];
  processingId: string | null;
  onVerify: (submission: PaymentSubmissionRecord) => void;
  onReject: (submission: PaymentSubmissionRecord) => void;
}

export function PaymentsTable({
  submissions,
  processingId,
  onVerify,
  onReject,
}: PaymentsTableProps) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <TableHead>
          <TableHeaderCell>Invoice</TableHeaderCell>
          <TableHeaderCell className="px-4">Client</TableHeaderCell>
          <TableHeaderCell className="px-4">Method</TableHeaderCell>
          <TableHeaderCell className="px-4">Sender Number</TableHeaderCell>
          <TableHeaderCell className="px-4">TrxID</TableHeaderCell>
          <TableHeaderCell className="px-4 text-right">Amount</TableHeaderCell>
          <TableHeaderCell className="px-4">Status</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableHead>
        <tbody className="divide-y divide-border text-sm">
          {submissions.map((sub) => {
            const isBusy = processingId === sub.id;
            const invoiceAlreadyPaid = sub.invoiceStatus === 'Paid';
            const canAct = sub.status === 'Pending' && !invoiceAlreadyPaid;
            const safeAmount = Number.isFinite(sub.amountBdt) ? sub.amountBdt : 0;
            const badgeClass = SUBMISSION_STATUS_BADGE_CLASSES[sub.status];
            const dotClass = SUBMISSION_STATUS_DOT_CLASSES[sub.status];

            return (
              <tr key={sub.id} className="hover:bg-surface-muted/60 transition-colors">
                <td className="py-3.5 px-6 whitespace-nowrap">
                  <Link
                    to={`/invoices/${sub.invoiceId}`}
                    className="inline-flex items-center gap-1 font-mono font-semibold text-primary-600 hover:underline num focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded-md"
                  >
                    <span>{sub.invoiceNumber || 'Invoice'}</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </Link>
                  <p className="text-xs text-muted num mt-0.5">{formatDateTime(sub.createdAt)}</p>
                </td>

                <td className="py-3.5 px-4">
                  <p className="font-medium text-foreground">{sub.clientName || 'Client'}</p>
                  {sub.projectTitle && (
                    <p className="text-xs text-muted truncate max-w-[180px]">{sub.projectTitle}</p>
                  )}
                </td>

                <td className="py-3.5 px-4 font-medium text-body whitespace-nowrap">
                  {sub.method || '—'}
                </td>

                <td className="py-3.5 px-4 font-mono text-xs text-body num whitespace-nowrap">
                  {sub.senderNumber || '—'}
                </td>

                <td className="py-3.5 px-4 font-mono text-xs font-semibold text-foreground num whitespace-nowrap">
                  {sub.transactionId || '—'}
                </td>

                <td className="py-3.5 px-4 text-right font-semibold text-foreground num whitespace-nowrap">
                  {formatBDT(safeAmount)}
                </td>

                <td className="py-3.5 px-4">
                  <Badge dot dotClassName={dotClass} className={badgeClass}>
                    {sub.status || 'Pending'}
                  </Badge>
                  {sub.status === 'Rejected' && sub.rejectionReason && (
                    <p className="mt-1 text-xs text-danger-text max-w-[200px]">
                      {sub.rejectionReason}
                    </p>
                  )}
                </td>

                <td className="py-3.5 px-6 text-right whitespace-nowrap">
                  {canAct ? (
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        loading={isBusy}
                        disabled={Boolean(processingId)}
                        onClick={() => onVerify(sub)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                      >
                        {isBusy ? 'Verifying...' : 'Verify'}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={Boolean(processingId)}
                        onClick={() => onReject(sub)}
                        icon={<XCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : sub.status === 'Pending' && invoiceAlreadyPaid ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs text-muted">Invoice already Paid</span>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={Boolean(processingId)}
                        onClick={() => onReject(sub)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Link
                      to={`/invoices/${sub.invoiceId}`}
                      className="text-xs font-semibold text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded-md"
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
