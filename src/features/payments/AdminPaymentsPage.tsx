import {AlertCircle, Clock, Search} from 'lucide-react';
import {PaymentsMobileList} from '@/features/payments/PaymentsMobileList';
import {PaymentsTable} from '@/features/payments/PaymentsTable';
import {RejectPaymentModal} from '@/features/payments/RejectPaymentModal';
import {useAdminPayments} from '@/features/payments/useAdminPayments';
import {getErrorMessage} from '@/services/serviceUtils';

export function AdminPaymentsPage() {
  const vm = useAdminPayments();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Payments to Verify
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review client bKash, Nagad, and Bank transaction submissions before marking invoices Paid.
        </p>
      </div>

      {vm.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{getErrorMessage(vm.error, 'Unable to load payment submissions.')}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          {vm.filterTabs.map((tab) => {
            const active = vm.statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => vm.setStatusFilter(tab.key)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={vm.search}
            onChange={(e) => vm.setSearch(e.target.value)}
            placeholder="Search TrxID, client, invoice..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {vm.loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : vm.filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Clock
              className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {vm.statusFilter === 'Pending'
                ? 'No pending payments to verify'
                : 'No matching payment submissions'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {vm.statusFilter === 'Pending'
                ? 'When clients submit bKash, Nagad, or Bank transaction details, they will appear here.'
                : 'Try changing the status filter or search query.'}
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <RejectPaymentModal
        submission={vm.rejectTarget}
        onClose={() => vm.setRejectTarget(null)}
        onConfirmReject={vm.handleConfirmReject}
      />
    </section>
  );
}
