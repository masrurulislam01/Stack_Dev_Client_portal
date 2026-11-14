import {ArrowRight, CheckCircle2, CreditCard, FolderKanban, Receipt} from 'lucide-react';
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
  const hasDue = unpaidCount > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {loadingInvoices ? (
        <div className="md:col-span-2 bg-surface rounded-2xl border border-border card-inset p-6 min-h-[156px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-40 rounded-lg skeleton-shimmer" />
            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-9 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-3.5 w-56 rounded-lg skeleton-shimmer" />
        </div>
      ) : (
        <div
          className={`md:col-span-2 bg-surface rounded-2xl border card-inset p-6 min-h-[156px] flex flex-col justify-between gap-4 relative overflow-hidden ${
            hasDue ? 'border-accent-gold/50' : 'border-border'
          }`}
        >
          {hasDue && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-accent-gold-soft/70 blur-2xl"
            />
          )}

          <div className="relative flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Amount Due (BDT)
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                overdueCount > 0
                  ? 'bg-danger-soft text-danger-text'
                  : hasDue
                    ? 'bg-accent-gold-soft text-accent-gold'
                    : 'bg-success-soft text-success-text'
              }`}
            >
              <Receipt className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div
            className={`relative font-heading text-[32px] leading-[38px] font-extrabold tracking-tight num ${
              overdueCount > 0
                ? 'text-danger-text'
                : hasDue
                  ? 'text-foreground'
                  : 'text-success-text'
            }`}
          >
            {formatBDT(totalUnpaidAmount)}
          </div>

          <div className="relative flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            {!hasDue ? (
              <span className="inline-flex items-center gap-1.5 text-success-text font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>All invoices are paid — no balance due.</span>
              </span>
            ) : (
              <span className="num">
                {unpaidCount} unpaid {unpaidCount === 1 ? 'invoice' : 'invoices'}
                {overdueCount > 0 && (
                  <span className="text-danger-text font-semibold"> · {overdueCount} overdue</span>
                )}
              </span>
            )}

            {hasDue ? (
              <Link
                to="/invoices"
                className="inline-flex items-center justify-center gap-2 min-h-[36px] px-4 py-1.5 rounded-xl bg-gradient-brand text-white hover:brightness-110 hover:shadow-brand text-xs font-semibold transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pay Now</span>
              </Link>
            ) : (
              <Link
                to="/invoices"
                className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:underline"
              >
                <span>Go to Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      )}

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
              Active Projects
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div className="font-heading text-[32px] leading-[38px] font-extrabold tracking-tight text-foreground num">
            {activeProjectsCount}
          </div>

          <p className="text-xs text-muted num">
            {totalProjectsCount} total {totalProjectsCount === 1 ? 'engagement' : 'engagements'} with
            Stack Dev
          </p>
        </div>
      )}
    </div>
  );
}
