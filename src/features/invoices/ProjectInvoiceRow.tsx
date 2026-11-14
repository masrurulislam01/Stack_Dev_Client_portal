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
import {INVOICE_STATUS_BADGE_CLASSES} from '@/config/constants';
import type {InvoiceRecord} from '@/types/portal';
import {formatBDT, formatDateDisplay} from '@/utils/format';
import {downloadInvoicePdf} from '@/utils/invoicePdf';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

interface ProjectInvoiceRowProps {
  invoice: InvoiceRecord;
  isAdmin: boolean;
  hasPendingReview: boolean;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  onMarkPaid: (invoice: InvoiceRecord) => void;
  onEdit: (invoice: InvoiceRecord) => void;
  onRequestDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
}

export function ProjectInvoiceRow({
  invoice,
  isAdmin,
  hasPendingReview,
  isConfirmingDelete,
  isDeleting,
  onMarkPaid,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ProjectInvoiceRowProps) {
  const effectiveStatus = getEffectiveInvoiceStatus(invoice);

  return (
    <li className="p-5 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/invoices/${invoice.id}`}
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tabular-nums"
          >
            {invoice.invoiceNumber}
          </Link>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${INVOICE_STATUS_BADGE_CLASSES[effectiveStatus]}`}
          >
            {effectiveStatus}
          </span>
          {hasPendingReview && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60 whitespace-nowrap">
              <Clock className="w-3 h-3" aria-hidden="true" />
              Payment under review
            </span>
          )}
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatBDT(invoice.amount)}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          Issued {formatDateDisplay(invoice.issueDate)} · Due {formatDateDisplay(invoice.dueDate)}
          {effectiveStatus === 'Paid' && invoice.paymentMethod
            ? ` · Paid via ${invoice.paymentMethod}`
            : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link
          to={`/invoices/${invoice.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          <span>View</span>
        </Link>

        <button
          type="button"
          onClick={() => downloadInvoicePdf(invoice)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>PDF</span>
        </button>

        {!isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
          <Link
            to={`/invoices/${invoice.id}#pay-now`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{hasPendingReview ? 'Under Review' : 'Pay Now'}</span>
          </Link>
        )}

        {isAdmin && effectiveStatus !== 'Paid' && (
          <button
            type="button"
            onClick={() => onMarkPaid(invoice)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
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
              aria-label={`Edit ${invoice.invoiceNumber}`}
              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>

            {isConfirmingDelete ? (
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => onConfirmDelete(invoice.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onCancelDelete}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onRequestDelete(invoice.id)}
                aria-label={`Delete ${invoice.invoiceNumber}`}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
