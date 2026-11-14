import {Clock} from 'lucide-react';
import {
  AGENCY_ADDRESS,
  AGENCY_NAME,
  AGENCY_PHONE,
  formatBDT,
} from '@/lib/constants';
import type {InvoiceRecord, InvoiceStatus} from '@/types/portal';
import {formatDateDisplay, formatDateTime} from '@/utils/format';

const SHEET_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Sent: 'bg-amber-50 text-amber-700 border-amber-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
};

interface InvoiceSheetProps {
  invoice: InvoiceRecord;
  effectiveStatus: InvoiceStatus;
  hasPendingReview: boolean;
  hideForReceiptPrint: boolean;
}

export function InvoiceSheet({
  invoice,
  effectiveStatus,
  hasPendingReview,
  hideForReceiptPrint,
}: InvoiceSheetProps) {
  return (
    <article
      className={`bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none ${
        hideForReceiptPrint ? 'print:hidden' : ''
      }`}
    >
      <div className="h-2 bg-indigo-600" />

      <div className="p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-indigo-700">
              {AGENCY_NAME}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">{AGENCY_ADDRESS}</p>
            <p className="text-sm text-slate-600 tabular-nums">Phone: {AGENCY_PHONE}</p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Invoice
            </p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {invoice.invoiceNumber}
            </p>
            <div className="flex flex-wrap sm:justify-end items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SHEET_BADGE_CLASSES[effectiveStatus]}`}
              >
                {effectiveStatus}
              </span>
              {hasPendingReview && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  Payment under review
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bill To
            </p>
            <p className="mt-1.5 text-base font-semibold text-slate-900">
              {invoice.clientName || 'Client'}
            </p>
            {invoice.clientEmail && (
              <p className="text-sm text-slate-600">{invoice.clientEmail}</p>
            )}
            {invoice.projectTitle && (
              <p className="mt-1 text-sm text-slate-600">
                Project:{' '}
                <span className="font-medium text-slate-800">{invoice.projectTitle}</span>
              </p>
            )}
          </div>

          <dl className="sm:text-right space-y-2 text-sm">
            <div className="flex sm:justify-end gap-4">
              <dt className="text-slate-500">Issue Date:</dt>
              <dd className="font-medium text-slate-900 tabular-nums">
                {formatDateDisplay(invoice.issueDate)}
              </dd>
            </div>
            <div className="flex sm:justify-end gap-4">
              <dt className="text-slate-500">Due Date:</dt>
              <dd
                className={`font-semibold tabular-nums ${
                  effectiveStatus === 'Overdue' ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {formatDateDisplay(invoice.dueDate)}
              </dd>
            </div>
            <div className="flex sm:justify-end gap-4">
              <dt className="text-slate-500">Currency:</dt>
              <dd className="font-medium text-slate-900">BDT (৳)</dd>
            </div>
          </dl>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-4 text-slate-900 font-medium">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                    {formatBDT(item.unitPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatBDT(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="text-xs text-slate-500 max-w-md space-y-2">
            {effectiveStatus !== 'Paid' && (
              <p>
                Pay via bKash, Nagad, or Bank transfer and submit your Transaction ID below in the &ldquo;Pay Now&rdquo; section, referencing{' '}
                <span className="font-semibold text-slate-800">{invoice.invoiceNumber}</span>.
              </p>
            )}
          </div>

          <div className="w-full sm:w-72 rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-900">
              {effectiveStatus === 'Paid' ? 'Total Paid' : 'Total Due'}
            </span>
            <span className="text-xl font-bold text-indigo-700 tabular-nums">
              {formatBDT(invoice.amount)}
            </span>
          </div>
        </div>

        {effectiveStatus === 'Paid' && invoice.paymentMethod && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Payment Recorded
            </p>
            <p className="text-sm font-medium text-slate-900">
              Paid via <span className="font-semibold">{invoice.paymentMethod}</span>
              {invoice.paidAt ? ` on ${formatDateTime(invoice.paidAt)}` : ''}
            </p>
            {invoice.paymentReference && (
              <p className="text-xs text-slate-600 font-mono">
                Reference: {invoice.paymentReference}
              </p>
            )}
          </div>
        )}

        {invoice.notes && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Notes
            </p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {invoice.notes}
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          {AGENCY_ADDRESS} · {AGENCY_PHONE} · Thank you for choosing Stack Dev.
        </div>
      </div>
    </article>
  );
}
