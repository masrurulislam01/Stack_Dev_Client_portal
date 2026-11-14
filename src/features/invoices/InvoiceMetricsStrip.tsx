import {AlertTriangle, CheckCircle2, Clock} from 'lucide-react';
import {Card} from '@/components/ui';
import {formatBDT} from '@/utils/format';

export interface InvoiceSummaryMetrics {
  unpaidAmount: number;
  overdueAmount: number;
  paidAmount: number;
  overdueCount: number;
}

export function InvoiceMetricsStrip({
  summary,
  loading = false,
}: {
  summary: InvoiceSummaryMetrics;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="p-5 flex items-start justify-between gap-3">
            <div className="space-y-2.5 flex-1">
              <div className="h-3.5 w-24 rounded skeleton-shimmer" />
              <div className="h-8 w-32 rounded skeleton-shimmer" />
            </div>
            <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Unpaid Balance
          </p>
          <p className="mt-2 font-heading text-2xl sm:text-[30px] sm:leading-[36px] font-extrabold text-warning-text kpi-value">
            {formatBDT(summary.unpaidAmount)}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-warning-soft text-warning-text flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" aria-hidden="true" />
        </div>
      </Card>

      <Card className="p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Overdue ({summary.overdueCount})
          </p>
          <p
            className={`mt-2 font-heading text-2xl sm:text-[30px] sm:leading-[36px] font-extrabold kpi-value ${
              summary.overdueCount > 0 ? 'text-danger-text' : 'text-foreground'
            }`}
          >
            {formatBDT(summary.overdueAmount)}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            summary.overdueCount > 0
              ? 'bg-danger-soft text-danger-text'
              : 'bg-surface-muted text-muted'
          }`}
        >
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
      </Card>

      <Card className="p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Total Paid
          </p>
          <p className="mt-2 font-heading text-2xl sm:text-[30px] sm:leading-[36px] font-extrabold text-success-text kpi-value">
            {formatBDT(summary.paidAmount)}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-success-soft text-success-text flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
        </div>
      </Card>
    </div>
  );
}
