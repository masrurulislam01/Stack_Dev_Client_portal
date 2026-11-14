import {AlertCircle, FileText, Plus, Search, X} from 'lucide-react';
import {InvoiceFormModal} from '@/features/invoices/InvoiceFormModal';
import {InvoiceMetricsStrip} from '@/features/invoices/InvoiceMetricsStrip';
import {InvoicesMobileList} from '@/features/invoices/InvoicesMobileList';
import {InvoicesTable} from '@/features/invoices/InvoicesTable';
import {MarkPaidModal} from '@/features/invoices/MarkPaidModal';
import {useInvoicesList} from '@/features/invoices/useInvoicesList';
import {useLanguage} from '@/hooks/useLanguage';

export function InvoicesPage() {
  const {t} = useLanguage();
  const vm = useInvoicesList();

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Invoices
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {vm.isAdmin
              ? 'Create BDT invoices, record bKash/Nagad/Bank/Cash payments, and download PDF statements.'
              : 'Review your Stack Dev billing statements, due dates, and downloadable PDF invoices.'}
          </p>
        </div>

        {vm.isAdmin && (
          <button
            type="button"
            onClick={() => {
              vm.setEditingInvoice(null);
              vm.setIsModalOpen(true);
            }}
            disabled={vm.clients.length === 0 || vm.projects.length === 0}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{t.actions.createInvoice}</span>
          </button>
        )}
      </div>

      {vm.displayedError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{vm.displayedError}</span>
          </div>
          {vm.paymentError && (
            <button
              type="button"
              onClick={() => vm.setPaymentError(null)}
              aria-label="Dismiss payment error"
              className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <InvoiceMetricsStrip summary={vm.summary} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {vm.filterStatuses.map((st) => {
            const active = vm.statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => vm.setStatusFilter(st)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
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
            placeholder="Search invoice #, client, project..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {vm.loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : vm.filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText
              className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {vm.invoices.length === 0 ? 'No invoices found' : 'No matching invoices'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {vm.invoices.length === 0
                ? vm.isAdmin
                  ? 'Create your first invoice to start billing clients in BDT.'
                  : 'Published invoices from Stack Dev will appear here.'
                : 'Try adjusting your status filter or search query.'}
            </p>
          </div>
        ) : (
          <>
            <InvoicesTable
              invoices={vm.filteredInvoices}
              isAdmin={vm.isAdmin}
              pendingInvoiceIds={vm.pendingInvoiceIds}
              confirmDeleteId={vm.confirmDeleteId}
              deletingId={vm.deletingId}
              t={t}
              onEdit={(inv) => {
                vm.setEditingInvoice(inv);
                vm.setIsModalOpen(true);
              }}
              onMarkPaid={vm.setMarkingPaidInvoice}
              onRequestDelete={vm.setConfirmDeleteId}
              onCancelDelete={() => vm.setConfirmDeleteId(null)}
              onConfirmDelete={(id) => void vm.handleDeleteInvoice(id)}
            />
            <InvoicesMobileList
              invoices={vm.filteredInvoices}
              isAdmin={vm.isAdmin}
              pendingInvoiceIds={vm.pendingInvoiceIds}
              t={t}
              onMarkPaid={vm.setMarkingPaidInvoice}
            />
          </>
        )}
      </div>

      {vm.isAdmin && (
        <>
          <InvoiceFormModal
            isOpen={vm.isModalOpen}
            onClose={() => {
              vm.setIsModalOpen(false);
              vm.setEditingInvoice(null);
            }}
            onSave={vm.handleSaveInvoice}
            clients={vm.clients}
            projects={vm.projects}
            nextInvoiceNumber={vm.nextInvoiceNumber}
            initialInvoice={vm.editingInvoice}
          />
          <MarkPaidModal
            invoice={vm.markingPaidInvoice}
            onClose={() => vm.setMarkingPaidInvoice(null)}
            onConfirm={vm.handleConfirmMarkPaid}
          />
        </>
      )}
    </section>
  );
}
