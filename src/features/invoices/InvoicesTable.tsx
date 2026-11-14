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
import type {TranslationDictionary} from '@/i18n/translations';
import type {InvoiceRecord} from '@/types/portal';
import {formatBDT, formatDateDisplay} from '@/utils/format';
import {downloadInvoicePdf} from '@/utils/invoicePdf';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

interface InvoicesTableProps {
  invoices: InvoiceRecord[];
  isAdmin: boolean;
  pendingInvoiceIds: Set<string>;
  confirmDeleteId: string | null;
  deletingId: string | null;
  t: TranslationDictionary;
  onEdit: (invoice: InvoiceRecord) => void;
  onMarkPaid: (invoice: InvoiceRecord) => void;
  onRequestDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
}

export function InvoicesTable({
  invoices,
  isAdmin,
  pendingInvoiceIds,
  confirmDeleteId,
  deletingId,
  t,
  onEdit,
  onMarkPaid,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: InvoicesTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
            <th className="py-3 px-6">Invoice #</th>
            {isAdmin && <th className="py-3 px-4">Client</th>}
            <th className="py-3 px-4">Project</th>
            <th className="py-3 px-4">Amount</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          {invoices.map((inv) => {
            const effectiveStatus = getEffectiveInvoiceStatus(inv);
            const hasPendingReview =
              effectiveStatus !== 'Paid' && pendingInvoiceIds.has(inv.id);
            const isConfirming = confirmDeleteId === inv.id;
            const isDeleting = deletingId === inv.id;

            return (
              <tr
                key={inv.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3.5 px-6 font-semibold whitespace-nowrap tabular-nums">
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {inv.invoiceNumber}
                  </Link>
                </td>
                {isAdmin && (
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                    {inv.clientName}
                  </td>
                )}
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                  {inv.projectTitle}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                  {formatBDT(inv.amount)}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                  {formatDateDisplay(inv.dueDate)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${INVOICE_STATUS_BADGE_CLASSES[effectiveStatus]}`}
                    >
                      {effectiveStatus}
                    </span>
                    {hasPendingReview && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        Payment under review
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-6 text-right whitespace-nowrap">
                  {isConfirming ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onConfirmDelete(inv.id)}
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
                    <div className="inline-flex items-center gap-1">
                      <Link
                        to={`/invoices/${inv.id}`}
                        title="View / Print Invoice"
                        aria-label={`View ${inv.invoiceNumber}`}
                        className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => downloadInvoicePdf(inv)}
                        title={t.actions.downloadPdf}
                        aria-label={`Download PDF for ${inv.invoiceNumber}`}
                        className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      >
                        <Download className="w-4 h-4" aria-hidden="true" />
                      </button>
                      {!isAdmin && effectiveStatus !== 'Paid' && inv.amount > 0 && (
                        <Link
                          to={`/invoices/${inv.id}#pay-now`}
                          className="ml-1 inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
                        >
                          <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{hasPendingReview ? 'Reviewing' : t.actions.payOnline}</span>
                        </Link>
                      )}
                      {isAdmin && effectiveStatus !== 'Paid' && (
                        <button
                          type="button"
                          onClick={() => onMarkPaid(inv)}
                          title={t.actions.markPaid}
                          className="ml-1 inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t.actions.markPaid}</span>
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(inv)}
                            aria-label={`Edit ${inv.invoiceNumber}`}
                            className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDelete(inv.id)}
                            aria-label={`Delete ${inv.invoiceNumber}`}
                            className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
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
