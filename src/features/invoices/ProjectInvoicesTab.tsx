import {FileText, Plus} from 'lucide-react';
import {Button, Card, ConfirmDialog, EmptyState, ErrorAlert} from '@/components/ui';
import {InvoiceFormModal} from '@/features/invoices/InvoiceFormModal';
import {MarkPaidModal} from '@/features/invoices/MarkPaidModal';
import {ProjectInvoiceRow} from '@/features/invoices/ProjectInvoiceRow';
import {useProjectInvoices} from '@/features/invoices/useProjectInvoices';
import type {PortalUser} from '@/hooks/useAuth';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ClientRecord, ProjectRecord} from '@/types/portal';
import {formatBDT} from '@/utils/format';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

interface ProjectInvoicesTabProps {
  project: ProjectRecord;
  user: PortalUser;
  clients?: ClientRecord[];
}

export function ProjectInvoicesTab({
  project,
  user,
  clients = [],
}: ProjectInvoicesTabProps) {
  const vm = useProjectInvoices(project, user, clients);

  const displayedError =
    vm.actionError ||
    (vm.invoicesError ? getErrorMessage(vm.invoicesError, 'Unable to load project invoices.') : null);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Project Invoices
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {vm.isAdmin
                ? `Manage billing, PDF invoices, and payment records for ${project.title || 'this project'}.`
                : `View statements, download PDF invoices, and submit payment details for ${project.title || 'this project'}.`}
            </p>
          </div>
          {vm.isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                vm.setEditingInvoice(null);
                vm.setIsModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" aria-hidden="true" />}
              className="whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              Create Invoice
            </Button>
          )}
        </div>

        {displayedError && (
          <div className="px-6 pt-4">
            <ErrorAlert
              message={displayedError}
              onRetry={vm.invoicesError ? () => void vm.refetchInvoices() : undefined}
              retrying={vm.isRetryingInvoices}
              onDismiss={vm.actionError ? () => vm.setActionError(null) : undefined}
            />
          </div>
        )}

        {vm.loading ? (
          <ul className="divide-y divide-border">
            {[1, 2].map((row) => (
              <li
                key={row}
                className="p-5 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-24 rounded skeleton-shimmer" />
                    <div className="h-5 w-16 rounded-full skeleton-shimmer" />
                    <div className="h-4 w-20 rounded skeleton-shimmer" />
                  </div>
                  <div className="h-3 w-48 rounded skeleton-shimmer" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-16 rounded-xl skeleton-shimmer" />
                  <div className="h-8 w-16 rounded-xl skeleton-shimmer" />
                </div>
              </li>
            ))}
          </ul>
        ) : vm.invoices.length === 0 ? (
          <EmptyState
            className="border-0 rounded-none shadow-none py-10"
            icon={<FileText className="w-5 h-5" aria-hidden="true" />}
            title="No invoices for this project yet"
            description={
              vm.isAdmin
                ? 'Create an invoice to bill the client in BDT and generate a printable PDF.'
                : 'When Stack Dev issues an invoice for this project, it will appear here.'
            }
            action={
              vm.isAdmin ? (
                <Button
                  size="sm"
                  onClick={() => {
                    vm.setEditingInvoice(null);
                    vm.setIsModalOpen(true);
                  }}
                  icon={<Plus className="w-4 h-4" aria-hidden="true" />}
                >
                  Create Invoice
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {vm.invoices.map((invoice) => {
              const effectiveStatus = getEffectiveInvoiceStatus(invoice);
              const hasPendingReview =
                effectiveStatus !== 'Paid' && vm.pendingInvoiceIds.has(invoice.id);
              return (
                <ProjectInvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  isAdmin={vm.isAdmin}
                  hasPendingReview={hasPendingReview}
                  isDeleting={vm.deletingId === invoice.id}
                  onMarkPaid={vm.setMarkingPaidInvoice}
                  onEdit={(inv) => {
                    vm.setEditingInvoice(inv);
                    vm.setIsModalOpen(true);
                  }}
                  onRequestDelete={vm.requestDeleteInvoice}
                />
              );
            })}
          </ul>
        )}
      </Card>

      {vm.isAdmin && (
        <>
          <InvoiceFormModal
            isOpen={vm.isModalOpen}
            onClose={() => {
              vm.setIsModalOpen(false);
              vm.setEditingInvoice(null);
            }}
            onSave={vm.handleSaveInvoice}
            clients={vm.resolvedClients}
            projects={[project]}
            nextInvoiceNumber={vm.nextInvoiceNumber}
            initialInvoice={vm.editingInvoice}
            lockedClientId={project.clientId}
            lockedProjectId={project.id}
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
            titleId="delete-project-invoice-title"
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
    </div>
  );
}
