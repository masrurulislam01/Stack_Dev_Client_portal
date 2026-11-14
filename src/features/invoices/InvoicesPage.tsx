import {FileText, Plus, Search} from 'lucide-react';
import {Link} from 'react-router-dom';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorAlert,
  Input,
  TableContainer,
  TableHead,
  TableHeaderCell,
} from '@/components/ui';
import {InvoiceFormModal} from '@/features/invoices/InvoiceFormModal';
import {InvoiceMetricsStrip} from '@/features/invoices/InvoiceMetricsStrip';
import {InvoicesMobileList} from '@/features/invoices/InvoicesMobileList';
import {InvoicesTable} from '@/features/invoices/InvoicesTable';
import {MarkPaidModal} from '@/features/invoices/MarkPaidModal';
import {useInvoicesList} from '@/features/invoices/useInvoicesList';
import {useLanguage} from '@/hooks/useLanguage';
import {formatBDT} from '@/utils/format';

export function InvoicesPage() {
  const {t} = useLanguage();
  const vm = useInvoicesList();

  return (
    <section className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="text-sm text-muted mt-1">
            {vm.isAdmin
              ? 'Create BDT invoices, record bKash/Nagad/Bank/Cash payments, and download PDF statements.'
              : 'Review your Stack Dev billing statements, due dates, and downloadable PDF invoices.'}
          </p>
        </div>

        {vm.isAdmin && (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              vm.setEditingInvoice(null);
              vm.setIsModalOpen(true);
            }}
            disabled={vm.clients.length === 0 || vm.projects.length === 0}
            icon={<Plus className="w-4 h-4" aria-hidden="true" />}
            className="whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            {t.actions.createInvoice}
          </Button>
        )}
      </div>

      {vm.displayedError && (
        <ErrorAlert
          message={vm.displayedError}
          onRetry={vm.invoicesError ? () => void vm.refetchInvoices() : undefined}
          retrying={vm.isRetryingInvoices}
          onDismiss={vm.paymentError ? () => vm.setPaymentError(null) : undefined}
        />
      )}

      <InvoiceMetricsStrip summary={vm.summary} loading={vm.loading} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter invoices by status">
          {vm.filterStatuses.map((st) => {
            const active = vm.statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                aria-pressed={active}
                onClick={() => vm.setStatusFilter(st)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                  active
                    ? 'bg-primary-50 text-primary-600 border-primary-200'
                    : 'bg-surface border-border text-muted hover:border-border-strong hover:text-foreground'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={vm.search}
            onChange={(e) => vm.setSearch(e.target.value)}
            placeholder="Search invoice #, client, project..."
            aria-label="Search invoices"
            className="pl-10"
          />
        </div>
      </div>

      {vm.loading ? (
        <Card className="overflow-hidden">
          <TableContainer className="hidden md:block border-0 rounded-none shadow-none">
            <TableHead>
              <TableHeaderCell className="px-6">Invoice #</TableHeaderCell>
              {vm.isAdmin && <TableHeaderCell>Client</TableHeaderCell>}
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell align="right">Amount</TableHeaderCell>
              <TableHeaderCell>Due Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell align="right" className="px-6">
                Actions
              </TableHeaderCell>
            </TableHead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4].map((row) => (
                <tr key={row} className="h-[56px]">
                  <td className="py-3.5 px-6">
                    <div className="h-4 w-24 rounded skeleton-shimmer" />
                  </td>
                  {vm.isAdmin && (
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-32 rounded skeleton-shimmer" />
                    </td>
                  )}
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-36 rounded skeleton-shimmer" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-4 w-20 rounded skeleton-shimmer ml-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-24 rounded skeleton-shimmer" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 w-16 rounded-full skeleton-shimmer" />
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="h-8 w-8 rounded-xl skeleton-shimmer" />
                      <div className="h-8 w-8 rounded-xl skeleton-shimmer" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
          <ul className="md:hidden divide-y divide-border">
            {[1, 2, 3].map((row) => (
              <li key={row} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 rounded skeleton-shimmer" />
                    <div className="h-3 w-40 rounded skeleton-shimmer" />
                  </div>
                  <div className="h-5 w-16 rounded-full skeleton-shimmer" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 rounded skeleton-shimmer" />
                  <div className="h-3 w-20 rounded skeleton-shimmer" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-20 rounded-xl skeleton-shimmer" />
                  <div className="h-9 w-24 rounded-xl skeleton-shimmer" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : vm.filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-5 h-5" aria-hidden="true" />}
          title={vm.invoices.length === 0 ? 'No invoices found' : 'No matching invoices'}
          description={
            vm.invoices.length === 0
              ? vm.isAdmin
                ? 'Create your first invoice to start billing clients in BDT.'
                : 'Published invoices from Stack Dev will appear here.'
              : 'Try adjusting your status filter or search query.'
          }
          action={
            vm.invoices.length === 0 ? (
              vm.isAdmin ? (
                vm.clients.length > 0 && vm.projects.length > 0 ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      vm.setEditingInvoice(null);
                      vm.setIsModalOpen(true);
                    }}
                    icon={<Plus className="w-4 h-4" aria-hidden="true" />}
                  >
                    {t.actions.createInvoice}
                  </Button>
                ) : (
                  <Link
                    to="/admin/projects"
                    className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-xl border border-border-strong bg-surface text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors"
                  >
                    Add a Client &amp; Project First
                  </Link>
                )
              ) : (
                <Link
                  to="/projects"
                  className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-semibold hover:brightness-110 transition-all"
                >
                  View Projects
                </Link>
              )
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  vm.setSearch('');
                  vm.setStatusFilter('ALL');
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <InvoicesTable
            invoices={vm.filteredInvoices}
            isAdmin={vm.isAdmin}
            pendingInvoiceIds={vm.pendingInvoiceIds}
            deletingId={vm.deletingId}
            t={t}
            onEdit={(inv) => {
              vm.setEditingInvoice(inv);
              vm.setIsModalOpen(true);
            }}
            onMarkPaid={vm.setMarkingPaidInvoice}
            onRequestDelete={vm.requestDeleteInvoice}
          />
          <InvoicesMobileList
            invoices={vm.filteredInvoices}
            isAdmin={vm.isAdmin}
            pendingInvoiceIds={vm.pendingInvoiceIds}
            deletingId={vm.deletingId}
            t={t}
            onMarkPaid={vm.setMarkingPaidInvoice}
            onEdit={(inv) => {
              vm.setEditingInvoice(inv);
              vm.setIsModalOpen(true);
            }}
            onRequestDelete={vm.requestDeleteInvoice}
          />
        </Card>
      )}

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
          <ConfirmDialog
            open={Boolean(vm.invoiceToDelete)}
            onClose={vm.cancelDeleteInvoice}
            onConfirm={vm.handleDeleteInvoice}
            title="Delete Invoice"
            titleId="delete-invoice-title"
            confirmLabel="Delete Invoice"
            confirmBusyLabel="Deleting..."
            loading={Boolean(vm.deletingId)}
            error={vm.deleteError}
            message={
              <>
                Permanently delete invoice{' '}
                <strong className="font-mono text-foreground">
                  {vm.invoiceToDelete?.invoiceNumber || 'this invoice'}
                </strong>
                {vm.invoiceToDelete ? ` (${formatBDT(vm.invoiceToDelete.amount)})` : ''}? This
                action cannot be undone.
              </>
            }
          />
        </>
      )}
    </section>
  );
}
