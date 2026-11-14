import {ArrowRight, CheckCircle2, FolderKanban, Receipt} from 'lucide-react';
import {Link} from 'react-router-dom';
import {formatBDT} from '@/utils/format';

interface ClientSummaryStripProps {
  loadingInvoices: boolean;
  loadingProjects: boolean;
  totalUnpaidAmount: number;
  unpaidCount: number;
  overdueCount: number;
  activeProjectsCount: number;
  totalProjectsCount: number;
}

export function ClientSummaryStrip({
  loadingInvoices,
  loadingProjects,
  totalUnpaidAmount,
  unpaidCount,
  overdueCount,
  activeProjectsCount,
  totalProjectsCount,
}: ClientSummaryStripProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
      {loadingInvoices ? (
        <div className="md:col-span-2 p-6 min-h-[148px] animate-pulse flex flex-col justify-between">
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3.5 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="md:col-span-2 p-6 min-h-[148px] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
              Total Unpaid Invoices (BDT)
            </span>
            <Receipt
              className={`w-4 h-4 shrink-0 ${
                overdueCount > 0
                  ? 'text-red-600 dark:text-red-400'
                  : unpaidCount > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              }`}
              aria-hidden="true"
            />
          </div>

          <div
            className={`font-mono text-3xl sm:text-[34px] leading-none font-semibold tracking-tight tabular-nums ${
              overdueCount > 0
                ? 'text-red-600 dark:text-red-400'
                : unpaidCount > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {formatBDT(totalUnpaidAmount)}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            {unpaidCount === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>All invoices are paid — no balance due.</span>
              </span>
            ) : (
              <span className="tabular-nums">
                {unpaidCount} unpaid {unpaidCount === 1 ? 'invoice' : 'invoices'}
                {overdueCount > 0 && (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {' '}
                    · {overdueCount} overdue
                  </span>
                )}
              </span>
            )}
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Go to Invoices</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {loadingProjects ? (
        <div className="p-6 min-h-[148px] animate-pulse flex flex-col justify-between">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="p-6 min-h-[148px] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
              Active Projects
            </span>
            <FolderKanban
              className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="font-mono text-3xl sm:text-[34px] leading-none font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {activeProjectsCount}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {totalProjectsCount} total {totalProjectsCount === 1 ? 'engagement' : 'engagements'} with
            Stack Dev
          </p>
        </div>
      )}
    </div>
  );
}
