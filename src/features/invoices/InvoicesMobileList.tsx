import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import {formatBDT, INVOICE_STATUS_BADGE_CLASSES} from '@/lib/constants';
import type {InvoiceRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';
import {downloadInvoicePdf} from '@/utils/invoicePdf';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

interface InvoicesMobileListProps {
  invoices: InvoiceRecord[];
  isAdmin: boolean;
  pendingInvoiceIds: Set<string>;
  viewLabel: string;
  downloadLabel: string;
  payLabel: string;
  markPaidLabel: string;
  onMarkPaid: (invoice: InvoiceRecord) => void;
}

export function InvoicesMobileList({
  invoices,
  isAdmin,
  pendingInvoiceIds,
  viewLabel,
  downloadLabel,
  payLabel,
  markPaidLabel,
  onMarkPaid,
}: InvoicesMobileListProps) {
  return (
    <ul className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
      {invoices.map((inv) => {
        const effectiveStatus = getEffectiveInvoiceStatus(inv);
        const hasPendingReview =
          effectiveStatus !== 'Paid' && pendingInvoiceIds.has(inv.id);
        return (
          <li key={inv.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/invoices/${inv.id}`}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tabular-nums"
                >
                  {inv.invoiceNumber}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAdmin ? `${inv.clientName} · ` : ''}
                  {inv.projectTitle}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatBDT(inv.amount)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Due {formatDateDisplay(inv.dueDate)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/invoices/${inv.id}`}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{viewLabel}</span>
              </Link>
              <button
                type="button"
                onClick={() => downloadInvoicePdf(inv)}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{downloadLabel}</span>
              </button>
              {!isAdmin && effectiveStatus !== 'Paid' && inv.amount > 0 && (
                <Link
                  to={`/invoices/${inv.id}#pay-now`}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm whitespace-nowrap"
                >
                  <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{hasPendingReview ? 'Reviewing' : payLabel}</span>
                </Link>
              )}
              {isAdmin && effectiveStatus !== 'Paid' && (
                <button
                  type="button"
                  onClick={() => onMarkPaid(inv)}
                  className="inline-flex items-center gap-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{markPaidLabel}</span>
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
