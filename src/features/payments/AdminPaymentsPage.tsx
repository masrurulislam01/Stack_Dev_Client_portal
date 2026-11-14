import {Clock, Search} from 'lucide-react';
import {Link} from 'react-router-dom';
import {
  Button,
  EmptyState,
  ErrorAlert,
  Skeleton,
  TableHead,
  TableHeaderCell,
} from '@/components/ui';
import {PaymentsMobileList} from '@/features/payments/PaymentsMobileList';
import {PaymentsTable} from '@/features/payments/PaymentsTable';
import {RejectPaymentModal} from '@/features/payments/RejectPaymentModal';
import {useAdminPayments} from '@/features/payments/useAdminPayments';
import {getErrorMessage} from '@/services/serviceUtils';

function PaymentsSkeleton() {
  return (
    <div>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <TableHead>
            <TableHeaderCell>Invoice</TableHeaderCell>
            <TableHeaderCell className="px-4">Client</TableHeaderCell>
            <TableHeaderCell className="px-4">Method</TableHeaderCell>
            <TableHeaderCell className="px-4">Sender Number</TableHeaderCell>
            <TableHeaderCell className="px-4">TrxID</TableHeaderCell>
            <TableHeaderCell className="px-4 text-right">Amount</TableHeaderCell>
            <TableHeaderCell className="px-4">Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableHead>
          <tbody className="divide-y divide-border">
            {[1, 2, 3, 4].map((row) => (
              <tr key={row}>
                <td className="py-3.5 px-6 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-28" />
                </td>
                <td className="py-3.5 px-4 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-4 w-14" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-3.5 w-24" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-3.5 w-24" />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </td>
                <td className="py-3.5 px-4">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="py-3.5 px-6 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Skeleton className="h-9 w-20 rounded-xl" />
                    <Skeleton className="h-9 w-16 rounded-xl" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="lg:hidden divide-y divide-border">
        {[1, 2, 3].map((item) => (
          <li key={item} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 flex-1 rounded-xl" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminPaymentsPage() {
  const vm = useAdminPayments();
  const hasFilters = Boolean(vm.search.trim()) || vm.statusFilter !== 'ALL';

  return (
    <section className="space-y-6 page-enter">
      <div>
        <h1 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground">
          Payments to Verify
        </h1>
        <p className="text-sm text-muted mt-1">
          Review client bKash, Nagad, and Bank transaction submissions before marking invoices Paid.
        </p>
      </div>

      {vm.error && (
        <ErrorAlert
          message={getErrorMessage(vm.error, 'Unable to load payment submissions.')}
          onRetry={() => void vm.refetch()}
          retrying={vm.retrying}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface-muted border border-border">
          {vm.filterTabs.map((tab) => {
            const active = vm.statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => vm.setStatusFilter(tab.key)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap num cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                  active
                    ? 'bg-surface text-foreground shadow-xs'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={vm.search}
            onChange={(e) => vm.setSearch(e.target.value)}
            placeholder="Search TrxID, client, invoice..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-border hover:border-border-strong bg-surface text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-ring"
          />
        </div>
      </div>

      {vm.loading ? (
        <div className="bg-surface rounded-2xl border border-border card-inset overflow-hidden">
          <PaymentsSkeleton />
        </div>
      ) : vm.filtered.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-5 h-5" aria-hidden="true" />}
          title={
            vm.statusFilter === 'Pending' && !vm.search.trim()
              ? 'No pending payments to verify'
              : 'No matching payment submissions'
          }
          description={
            vm.statusFilter === 'Pending' && !vm.search.trim()
              ? 'When clients submit bKash, Nagad, or Bank transaction details, they will appear here.'
              : 'Try changing the status filter or clearing your search query.'
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {vm.error && (
                <Button
                  type="button"
                  size="sm"
                  loading={vm.retrying}
                  onClick={() => void vm.refetch()}
                >
                  {vm.retrying ? 'Retrying...' : 'Retry'}
                </Button>
              )}
              {hasFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    vm.setSearch('');
                    vm.setStatusFilter('ALL');
                  }}
                >
                  {vm.statusFilter === 'Pending' && !vm.search.trim()
                    ? 'View all submissions'
                    : 'Reset filters'}
                </Button>
              )}
              <Link
                to="/invoices"
                className="inline-flex items-center justify-center min-h-[36px] px-3.5 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-semibold hover:brightness-110 hover:shadow-brand transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                Open Invoices
              </Link>
            </div>
          }
        />
      ) : (
        <div className="bg-surface rounded-2xl border border-border card-inset overflow-hidden">
          <PaymentsTable
            submissions={vm.filtered}
            processingId={vm.processingId}
            onVerify={(sub) => void vm.handleVerify(sub)}
            onReject={vm.setRejectTarget}
          />
          <PaymentsMobileList
            submissions={vm.filtered}
            processingId={vm.processingId}
            onVerify={(sub) => void vm.handleVerify(sub)}
            onReject={vm.setRejectTarget}
          />
        </div>
      )}

      <RejectPaymentModal
        submission={vm.rejectTarget}
        onClose={() => vm.setRejectTarget(null)}
        onConfirmReject={vm.handleConfirmReject}
      />
    </section>
  );
}
