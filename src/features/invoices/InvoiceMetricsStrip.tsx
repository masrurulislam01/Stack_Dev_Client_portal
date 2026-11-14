import {formatBDT} from '@/utils/format';

export interface InvoiceSummaryMetrics {
  unpaidAmount: number;
  overdueAmount: number;
  paidAmount: number;
  overdueCount: number;
}

export function InvoiceMetricsStrip({summary}: {summary: InvoiceSummaryMetrics}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Unpaid Balance
        </p>
        <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
          {formatBDT(summary.unpaidAmount)}
        </p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Overdue ({summary.overdueCount})
        </p>
        <p
          className={`mt-2 text-2xl font-bold tabular-nums ${
            summary.overdueCount > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {formatBDT(summary.overdueAmount)}
        </p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Paid</p>
        <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatBDT(summary.paidAmount)}
        </p>
      </div>
    </div>
  );
}
