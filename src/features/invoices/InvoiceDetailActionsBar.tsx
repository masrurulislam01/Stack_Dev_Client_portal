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
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to Invoices</span>
      </Link>

      <div className="flex flex-wrap items-center gap-2.5">
        {isAdmin && effectiveStatus !== 'Paid' && (
          <button
            type="button"
            onClick={onMarkPaid}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>Mark Paid</span>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            <span>Edit</span>
          </button>
        )}

        {!isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
          <button
            type="button"
            onClick={onScrollToPayNow}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <CreditCard className="w-4 h-4" aria-hidden="true" />
            <span>{hasPendingReview ? 'Payment Under Review' : 'Pay Now'}</span>
          </button>
        )}

        {effectiveStatus === 'Paid' && (
          <button
            type="button"
            onClick={() => onPrint('receipt')}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors"
          >
            <Receipt className="w-4 h-4" aria-hidden="true" />
            <span>Print Receipt</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onPrint('invoice')}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          <span>Print</span>
        </button>

        <button
          type="button"
          onClick={() => downloadInvoicePdf(invoice)}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span>Download PDF</span>
        </button>
      </div>
    </div>
  );
}
