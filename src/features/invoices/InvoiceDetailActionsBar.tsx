import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  Pencil,
  Printer,
  Receipt,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui';
import type {InvoiceStatus} from '@/config/constants';
import type {InvoiceRecord} from '@/types/portal';
import {downloadInvoicePdf} from '@/utils/invoicePdf';

interface InvoiceDetailActionsBarProps {
  invoice: InvoiceRecord;
  isAdmin: boolean;
  effectiveStatus: InvoiceStatus;
  hasPendingReview: boolean;
  onMarkPaid: () => void;
  onEdit: () => void;
  onScrollToPayNow: () => void;
  onPrint: (mode: 'invoice' | 'receipt') => void;
}

export function InvoiceDetailActionsBar({
  invoice,
  isAdmin,
  effectiveStatus,
  hasPendingReview,
  onMarkPaid,
  onEdit,
  onScrollToPayNow,
  onPrint,
}: InvoiceDetailActionsBarProps) {
  return (
    <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <Link
        to="/invoices"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary-600 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to Invoices</span>
      </Link>

      <div className="flex flex-wrap items-center gap-2.5">
        {isAdmin && effectiveStatus !== 'Paid' && (
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={onMarkPaid}
            icon={<CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
          >
            Mark Paid
          </Button>
        )}

        {isAdmin && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onEdit}
            icon={<Pencil className="w-4 h-4" aria-hidden="true" />}
          >
            Edit
          </Button>
        )}

        {!isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={onScrollToPayNow}
            icon={<CreditCard className="w-4 h-4" aria-hidden="true" />}
          >
            {hasPendingReview ? 'Payment Under Review' : 'Pay Now'}
          </Button>
        )}

        {effectiveStatus === 'Paid' && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPrint('receipt')}
            icon={<Receipt className="w-4 h-4" aria-hidden="true" />}
            className="border-success/30 bg-success-soft text-success-text hover:brightness-95"
          >
            Print Receipt
          </Button>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPrint('invoice')}
          icon={<Printer className="w-4 h-4" aria-hidden="true" />}
        >
          Print
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => downloadInvoicePdf(invoice)}
          icon={<Download className="w-4 h-4" aria-hidden="true" />}
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
}
