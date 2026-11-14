import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge} from '@/components/ui';
import {
  INVOICE_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_DOT_CLASSES,
} from '@/config/constants';
import type {InvoiceRecord} from '@/types/portal';
import {formatBDT, formatDateDisplay} from '@/utils/format';
import {downloadInvoicePdf} from '@/utils/invoicePdf';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

interface ProjectInvoiceRowProps {
  invoice: InvoiceRecord;
  isAdmin: boolean;
  hasPendingReview: boolean;
  isDeleting: boolean;
  onMarkPaid: (invoice: InvoiceRecord) => void;
  onEdit: (invoice: InvoiceRecord) => void;
  onRequestDelete: (invoice: InvoiceRecord) => void;
}

export function ProjectInvoiceRow({
  invoice,
  isAdmin,
  hasPendingReview,
  isDeleting,
  onMarkPaid,
  onEdit,
  onRequestDelete,
}: ProjectInvoiceRowProps) {
  const invoiceNumber = invoice.invoiceNumber || 'Invoice';
  const amount = Number.isFinite(invoice.amount) ? invoice.amount : 0;
  const effectiveStatus = getEffectiveInvoiceStatus(invoice);
  const badgeClass = INVOICE_STATUS_BADGE_CLASSES[effectiveStatus];
  const dotClass = INVOICE_STATUS_DOT_CLASSES[effectiveStatus];

  return (
    <li className="p-5 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-surface-muted/60 transition-colors">
      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/invoices/${invoice.id}`}
            className="font-mono text-sm font-semibold text-primary-600 hover:underline num focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded-md"
          >
            {invoiceNumber}
          </Link>
          <Badge dot dotClassName={dotClass} className={badgeClass}>
            {effectiveStatus}
          </Badge>
          {hasPendingReview && (
            <Badge tone="warning" dot>
              <Clock className="w-3 h-3" aria-hidden="true" />
              Payment under review
            </Badge>
          )}
          <span className="font-heading text-sm font-bold text-foreground num">
            {formatBDT(amount)}
          </span>
        </div>
        <p className="text-xs text-muted num">
          Issued {formatDateDisplay(invoice.issueDate)} · Due {formatDateDisplay(invoice.dueDate)}
          {effectiveStatus === 'Paid' && invoice.paymentMethod
            ? ` · Paid via ${invoice.paymentMethod}`
            : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link
          to={`/invoices/${invoice.id}`}
          className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-border-strong bg-surface text-xs font-semibold text-foreground hover:bg-surface-muted shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <ExternalLink className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
          <span>View</span>
        </Link>

        <button
          type="button"
          onClick={() => downloadInvoicePdf(invoice)}
          className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-border-strong bg-surface text-xs font-semibold text-foreground hover:bg-surface-muted shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <Download className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
          <span>PDF</span>
        </button>

        {!isAdmin && effectiveStatus !== 'Paid' && amount > 0 && (
          <Link
            to={`/invoices/${invoice.id}#pay-now`}
            className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-semibold hover:brightness-110 hover:shadow-brand transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{hasPendingReview ? 'Under Review' : 'Pay Now'}</span>
          </Link>
        )}

        {isAdmin && effectiveStatus !== 'Paid' && (
          <button
            type="button"
            onClick={() => onMarkPaid(invoice)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-success text-white text-xs font-semibold hover:brightness-110 shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mark Paid</span>
          </button>
        )}

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => onEdit(invoice)}
              aria-label={`Edit ${invoiceNumber}`}
              className="inline-flex items-center justify-center min-w-[38px] min-h-[38px] p-2 rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onRequestDelete(invoice)}
              aria-label={`Delete ${invoiceNumber}`}
              className="inline-flex items-center justify-center min-w-[38px] min-h-[38px] p-2 rounded-xl text-muted hover:text-danger-text hover:bg-danger-soft disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
