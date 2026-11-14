import {AlertCircle, FileText, Plus, X} from 'lucide-react';
import {InvoiceFormModal} from '@/features/invoices/InvoiceFormModal';
import {MarkPaidModal} from '@/features/invoices/MarkPaidModal';
import {ProjectInvoiceRow} from '@/features/invoices/ProjectInvoiceRow';
import {useProjectInvoices} from '@/features/invoices/useProjectInvoices';
import type {PortalUser} from '@/hooks/useAuth';
import type {ClientRecord, ProjectRecord} from '@/types/portal';
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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Project Invoices
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {vm.isAdmin
                ? `Manage billing, PDF invoices, and payment records for ${project.title}.`
                : `View statements, download PDF invoices, and submit payment details for ${project.title}.`}
            </p>
          </div>
          {vm.isAdmin && (
            <button
              type="button"
              onClick={() => {
                vm.setEditingInvoice(null);
                vm.setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>

        {vm.actionError && (
          <div
            role="alert"
            className="mx-6 mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{vm.actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => vm.setActionError(null)}
              aria-label="Dismiss error"
              className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {vm.loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : vm.invoices.length === 0 ? (
          <div className="p-10 text-center">
            <FileText
              className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No invoices for this project yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {vm.isAdmin
                ? 'Create an invoice to bill the client in BDT and generate a printable PDF.'
                : 'When Stack Dev issues an invoice for this project, it will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
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
                  isConfirmingDelete={vm.confirmDeleteId === invoice.id}
                  isDeleting={vm.deletingId === invoice.id}
                  onMarkPaid={vm.setMarkingPaidInvoice}
                  onEdit={(inv) => {
                    vm.setEditingInvoice(inv);
                    vm.setIsModalOpen(true);
                  }}
                  onRequestDelete={vm.setConfirmDeleteId}
                  onCancelDelete={() => vm.setConfirmDeleteId(null)}
                  onConfirmDelete={(id) => void vm.handleDeleteInvoice(id)}
                />
              );
            })}
          </ul>
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
        </>
      )}
    </div>
  );
}
