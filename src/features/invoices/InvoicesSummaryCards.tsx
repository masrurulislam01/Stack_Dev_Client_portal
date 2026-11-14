import {formatBDT} from '@/lib/constants';

interface InvoicesSummaryCardsProps {
  unpaidAmount: number;
  overdueAmount: number;
  overdueCount: number;
  paidAmount: number;
}

export function InvoicesSummaryCards({
  unpaidAmount,
  overdueAmount,
  overdueCount,
  paidAmount,
}: InvoicesSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Unpaid Balance
        </p>
        <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
          {formatBDT(unpaidAmount)}
        </p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Overdue ({overdueCount})
        </p>
        <p
          className={`mt-2 text-2xl font-bold tabular-nums ${
            overdueCount > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {formatBDT(overdueAmount)}
        </p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Paid</p>
        <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatBDT(paidAmount)}
        </p>
      </div>
    </div>
  );
}
