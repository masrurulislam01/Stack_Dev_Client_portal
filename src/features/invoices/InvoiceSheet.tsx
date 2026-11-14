import {Clock} from 'lucide-react';
import {BrandLogo} from '@/components/layout/BrandLogo';
import {Badge} from '@/components/ui';
import {
  AGENCY_INFO,
  INVOICE_PRINT_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_DOT_CLASSES,
  type InvoiceStatus,
} from '@/config/constants';
import type {InvoiceRecord} from '@/types/portal';
import {formatBDT, formatDateDisplay, formatDateTime} from '@/utils/format';

interface InvoiceSheetProps {
  invoice: InvoiceRecord;
  effectiveStatus: InvoiceStatus;
  hasPendingReview: boolean;
  hiddenWhenPrintingReceipt: boolean;
}

const STAMP_LABELS: Record<InvoiceStatus, {text: string; className: string}> = {
  Paid: {
    text: 'PAID',
    className: 'border-success text-success-text bg-success-soft/60',
  },
  Sent: {
    text: 'DUE',
    className: 'border-info text-info-text bg-info-soft/60',
  },
  Overdue: {
    text: 'OVERDUE',
    className: 'border-danger text-danger-text bg-danger-soft/60',
  },
  Draft: {
    text: 'DRAFT',
    className: 'border-border-strong text-muted bg-surface-muted/80',
  },
};

export function InvoiceSheet({
  invoice,
  effectiveStatus,
  hasPendingReview,
  hiddenWhenPrintingReceipt,
}: InvoiceSheetProps) {
  const invoiceNumber = invoice.invoiceNumber || 'Invoice';
  const amount = Number.isFinite(invoice.amount) ? invoice.amount : 0;
  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  const stamp = STAMP_LABELS[effectiveStatus];

  return (
    <article
      className={`relative bg-surface text-foreground rounded-2xl border border-border card-inset overflow-hidden print:bg-white print:text-black print:border-0 print:shadow-none print:rounded-none ${
        hiddenWhenPrintingReceipt ? 'print:hidden' : ''
      }`}
    >
      <div className="h-2 bg-gradient-brand" />

      <div className="p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-border">
          <div>
            <BrandLogo size="md" />
            <p className="mt-3 text-sm text-body">{AGENCY_INFO.address}</p>
            <p className="text-sm text-muted num">Phone: {AGENCY_INFO.phone}</p>
          </div>

          <div className="sm:text-right space-y-2 relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Invoice
            </p>
            <p className="font-mono text-xl font-bold text-foreground num">{invoiceNumber}</p>
            <div className="flex flex-wrap sm:justify-end items-center gap-2">
              <Badge
                dot
                dotClassName={INVOICE_STATUS_DOT_CLASSES[effectiveStatus]}
                className={INVOICE_PRINT_STATUS_BADGE_CLASSES[effectiveStatus]}
              >
                {effectiveStatus}
              </Badge>
              {hasPendingReview && (
                <Badge tone="warning">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  Payment under review
                </Badge>
              )}
            </div>
            <div
              aria-hidden="true"
              className={`hidden sm:inline-block mt-2 px-3 py-1 rounded-lg border-2 font-heading text-xs font-extrabold tracking-[0.16em] uppercase -rotate-6 ${stamp.className}`}
            >
              {stamp.text}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Bill To
            </p>
            <p className="mt-1.5 font-heading text-base font-semibold text-foreground">
              {invoice.clientName || 'Client'}
            </p>
            {invoice.clientEmail && <p className="text-sm text-body">{invoice.clientEmail}</p>}
            {invoice.projectTitle && (
              <p className="mt-1 text-sm text-muted">
                Project: <span className="font-semibold text-foreground">{invoice.projectTitle}</span>
              </p>
            )}
          </div>

          <dl className="sm:text-right space-y-2 text-sm">
            <div className="flex sm:justify-end gap-4">
              <dt className="text-muted">Issue Date:</dt>
              <dd className="font-medium text-foreground num">
                {formatDateDisplay(invoice.issueDate)}
              </dd>
            </div>
            <div className="flex sm:justify-end gap-4">
              <dt className="text-muted">Due Date:</dt>
              <dd
                className={`font-semibold num ${
                  effectiveStatus === 'Overdue' ? 'text-danger-text' : 'text-foreground'
                }`}
              >
                {formatDateDisplay(invoice.dueDate)}
              </dd>
            </div>
            <div className="flex sm:justify-end gap-4">
              <dt className="text-muted">Currency:</dt>
              <dd className="font-medium text-foreground">BDT (৳)</dd>
            </div>
          </dl>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-5 px-4 text-center text-muted">
                    No line items specified.
                  </td>
                </tr>
              ) : (
                lineItems.map((item, idx) => (
                  <tr key={idx} className="h-[52px]">
                    <td className="py-3.5 px-4 text-foreground font-medium">
                      {item.description || 'Service Item'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-body num whitespace-nowrap">
                      {Number.isFinite(item.quantity) ? item.quantity : 1}
                    </td>
                    <td className="py-3.5 px-4 text-right text-body num whitespace-nowrap">
                      {formatBDT(Number.isFinite(item.unitPrice) ? item.unitPrice : 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-foreground num whitespace-nowrap">
                      {formatBDT(Number.isFinite(item.total) ? item.total : 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="text-xs text-muted max-w-md space-y-2 leading-relaxed">
            {effectiveStatus !== 'Paid' && (
              <p>
                Pay via bKash, Nagad, or Bank transfer and submit your Transaction ID below in the
                &ldquo;Pay Now&rdquo; section, referencing{' '}
                <span className="font-mono font-semibold text-foreground">{invoiceNumber}</span>.
              </p>
            )}
          </div>

          <div className="w-full sm:w-72 rounded-xl bg-primary-50 border border-primary-200 px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-primary-800">
              {effectiveStatus === 'Paid' ? 'Total Paid' : 'Total Due'}
            </span>
            <span className="font-heading text-xl font-extrabold text-primary-700 num">
              {formatBDT(amount)}
            </span>
          </div>
        </div>

        {effectiveStatus === 'Paid' && invoice.paymentMethod && (
          <div className="rounded-xl border border-success/30 bg-success-soft px-5 py-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-success-text">
              Payment Recorded
            </p>
            <p className="text-sm font-medium text-foreground">
              Paid via <span className="font-semibold">{invoice.paymentMethod}</span>
              {invoice.paidAt ? ` on ${formatDateTime(invoice.paidAt)}` : ''}
            </p>
            {invoice.paymentReference && (
              <p className="text-xs text-body font-mono">Reference: {invoice.paymentReference}</p>
            )}
          </div>
        )}

        {invoice.notes && (
          <div className="pt-4 border-t border-border">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5">
              Notes
            </p>
            <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
          </div>
        )}

        <div className="pt-6 border-t border-border text-center text-xs text-muted">
          {AGENCY_INFO.address} · {AGENCY_INFO.phone} · Thank you for choosing Stack Dev.
        </div>
      </div>
    </article>
  );
}
