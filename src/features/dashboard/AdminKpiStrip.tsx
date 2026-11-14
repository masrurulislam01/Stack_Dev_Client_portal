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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {loadingProjects ? (
        <div className="bg-surface rounded-2xl border border-border card-inset p-6 min-h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-28 rounded-lg skeleton-shimmer" />
            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-9 w-16 rounded-lg skeleton-shimmer" />
          <div className="h-3.5 w-40 rounded-lg skeleton-shimmer" />
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border card-inset p-6 min-h-[156px] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {t.dashboard.activeProjects}
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div className="font-heading text-[32px] leading-[38px] font-extrabold tracking-tight text-foreground num">
            {activeProjectCount}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            <span className="num">
              {totalProjectCount} total {totalProjectCount === 1 ? 'project' : 'projects'}
            </span>
            <Link
              to="/admin/projects"
              className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:underline"
            >
              <span>{t.dashboard.viewAllProjects}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {loadingClients ? (
        <div className="bg-surface rounded-2xl border border-border card-inset p-6 min-h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-24 rounded-lg skeleton-shimmer" />
            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-9 w-16 rounded-lg skeleton-shimmer" />
          <div className="h-3.5 w-36 rounded-lg skeleton-shimmer" />
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border card-inset p-6 min-h-[156px] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {t.dashboard.totalClients}
            </span>
            <div className="w-10 h-10 rounded-xl bg-info-soft text-info-text flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div className="font-heading text-[32px] leading-[38px] font-extrabold tracking-tight text-foreground num">
            {totalClientCount}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            <span className="num">{activeLoginCount} portal logins active</span>
            <Link
              to="/admin/clients"
              className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:underline"
            >
              <span>{t.dashboard.viewAllClients}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {loadingInvoices ? (
        <div className="bg-surface rounded-2xl border border-border card-inset p-6 min-h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-36 rounded-lg skeleton-shimmer" />
            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-9 w-36 rounded-lg skeleton-shimmer" />
          <div className="h-3.5 w-44 rounded-lg skeleton-shimmer" />
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border card-inset p-6 min-h-[156px] flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {t.dashboard.unpaidInvoices}
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                overdueCount > 0
                  ? 'bg-danger-soft text-danger-text'
                  : unpaidCount > 0
                    ? 'bg-warning-soft text-warning-text'
                    : 'bg-success-soft text-success-text'
              }`}
            >
              <Receipt className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div
            className={`font-heading text-[32px] leading-[38px] font-extrabold tracking-tight num ${
              overdueCount > 0
                ? 'text-danger-text'
                : unpaidCount > 0
                  ? 'text-warning-text'
                  : 'text-success-text'
            }`}
          >
            {formatBDT(totalUnpaidAmount)}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            <span className="num">
              {unpaidCount} unpaid
              {overdueCount > 0 && (
                <span className="text-danger-text font-semibold"> · {overdueCount} overdue</span>
              )}
            </span>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:underline"
            >
              <span>{t.dashboard.viewAllInvoices}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
