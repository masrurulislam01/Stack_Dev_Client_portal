import {ArrowRight, Building2, FolderKanban, Receipt} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useLanguage} from '@/hooks/useLanguage';
import {formatBDT} from '@/utils/format';

interface AdminKpiStripProps {
  loadingProjects: boolean;
  loadingClients: boolean;
  loadingInvoices: boolean;
  activeProjectCount: number;
  totalProjectCount: number;
  totalClientCount: number;
  activeLoginCount: number;
  unpaidCount: number;
  overdueCount: number;
  totalUnpaidAmount: number;
}

export function AdminKpiStrip({
  loadingProjects,
  loadingClients,
  loadingInvoices,
  activeProjectCount,
  totalProjectCount,
  totalClientCount,
  activeLoginCount,
  unpaidCount,
  overdueCount,
  totalUnpaidAmount,
}: AdminKpiStripProps) {
  const {t} = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
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
              {t.dashboard.activeProjects}
            </span>
            <FolderKanban
              className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="font-mono text-3xl sm:text-[34px] leading-none font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {activeProjectCount}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">
              {totalProjectCount} total {totalProjectCount === 1 ? 'project' : 'projects'}
            </span>
            <Link
              to="/admin/projects"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>{t.dashboard.viewAllProjects}</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {loadingClients ? (
        <div className="p-6 min-h-[148px] animate-pulse flex flex-col justify-between">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="p-6 min-h-[148px] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
              {t.dashboard.totalClients}
            </span>
            <Building2
              className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="font-mono text-3xl sm:text-[34px] leading-none font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {totalClientCount}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">{activeLoginCount} portal logins active</span>
            <Link
              to="/admin/clients"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>{t.dashboard.viewAllClients}</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {loadingInvoices ? (
        <div className="p-6 min-h-[148px] animate-pulse flex flex-col justify-between">
          <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3.5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : (
        <div className="p-6 min-h-[148px] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
              {t.dashboard.unpaidInvoices}
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
            className={`font-mono text-2xl sm:text-[32px] leading-none font-semibold tracking-tight tabular-nums ${
              overdueCount > 0
                ? 'text-red-600 dark:text-red-400'
                : unpaidCount > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {formatBDT(totalUnpaidAmount)}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">
              {unpaidCount} unpaid
              {overdueCount > 0 && (
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  {' '}
                  · {overdueCount} overdue
                </span>
              )}
            </span>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>{t.dashboard.viewAllInvoices}</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
