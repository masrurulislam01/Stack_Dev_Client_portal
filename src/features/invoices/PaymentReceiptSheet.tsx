import {Printer, Receipt} from 'lucide-react';
import {Badge, Button} from '@/components/ui';
import {AGENCY_INFO} from '@/config/constants';
import type {InvoiceRecord, PaymentSubmissionRecord} from '@/types/portal';
import {formatBDT, formatDateDisplay, formatDateTime} from '@/utils/format';

interface PaymentReceiptSheetProps {
  invoice: InvoiceRecord;
  verifiedSubmission?: PaymentSubmissionRecord;
  visibleWhenPrinting: boolean;
  onPrintReceipt: () => void;
}

export function PaymentReceiptSheet({
  invoice,
  verifiedSubmission,
  visibleWhenPrinting,
  onPrintReceipt,
}: PaymentReceiptSheetProps) {
  const invoiceNumber = invoice.invoiceNumber || 'Invoice';
  const amount = Number.isFinite(invoice.amount) ? invoice.amount : 0;
  const receiptNumber = `RCP-${invoiceNumber.replace(/^SD-/, '')}`;

  return (
    <article
      aria-label="Official Payment Receipt"
      className={`bg-surface text-foreground rounded-2xl border border-success/30 card-inset overflow-hidden print:bg-white print:text-black print:border print:border-border print:shadow-none print:rounded-none ${
        visibleWhenPrinting ? 'print:block' : 'print:hidden'
      }`}
    >
      <div className="px-6 py-4 bg-success-soft border-b border-success/25 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-surface text-success-text flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground">Payment Receipt</h3>
            <p className="font-mono text-xs text-muted num">{receiptNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge dot tone="success">
            PAID IN FULL
          </Badge>
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={onPrintReceipt}
            icon={<Printer className="w-3.5 h-3.5" aria-hidden="true" />}
            className="print:hidden"
          >
            Print Receipt
          </Button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-border">
          <div>
            <p className="font-heading text-lg font-extrabold text-primary-600">
              {AGENCY_INFO.name}
            </p>
            <p className="text-xs text-body">{AGENCY_INFO.address}</p>
            <p className="text-xs text-muted num">{AGENCY_INFO.phone}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Amount Received
            </p>
            <p className="mt-1 font-heading text-2xl font-extrabold text-success-text num">
              {formatBDT(amount)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Received From
            </dt>
            <dd className="font-semibold text-foreground mt-1">
              {invoice.clientName || 'Client'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Invoice Reference
            </dt>
            <dd className="font-mono font-semibold text-foreground num mt-1">{invoiceNumber}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Project
            </dt>
            <dd className="font-medium text-body mt-1">{invoice.projectTitle || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Payment Date
            </dt>
            <dd className="font-medium text-body num mt-1">
              {invoice.paidAt
                ? formatDateTime(invoice.paidAt)
                : formatDateDisplay(invoice.issueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Payment Method
            </dt>
            <dd className="font-medium text-body mt-1">
              {invoice.paymentMethod || verifiedSubmission?.method || 'Recorded'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Transaction Reference / TrxID
            </dt>
            <dd className="font-mono font-semibold text-foreground mt-1">
              {invoice.paymentReference ||
                verifiedSubmission?.transactionId ||
                'Manual confirmation'}
            </dd>
          </div>
          {verifiedSubmission?.senderNumber && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Sender Account / Number
              </dt>
              <dd className="font-mono text-body mt-1 num">{verifiedSubmission.senderNumber}</dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Verification Status
            </dt>
            <dd className="font-semibold text-success-text mt-1">Verified by Stack Dev</dd>
          </div>
        </dl>

        <div className="pt-4 border-t border-border text-center text-xs text-muted">
          This is an official payment receipt generated by {AGENCY_INFO.name} Client Portal.
        </div>
      </div>
    </article>
  );
}
