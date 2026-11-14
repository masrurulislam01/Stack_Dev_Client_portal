import {AlertCircle, X} from 'lucide-react';
import {Button, Input, Select, Textarea} from '@/components/ui';
import {INVOICE_STATUSES} from '@/config/constants';
import {InvoiceLineItemsEditor} from '@/features/invoices/InvoiceLineItemsEditor';
import {useInvoiceForm} from '@/features/invoices/useInvoiceForm';
import type {
  ClientRecord,
  InvoiceFormParsed,
  InvoiceRecord,
  ProjectRecord,
} from '@/types/portal';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: InvoiceFormParsed) => Promise<void>;
  clients: ClientRecord[];
  projects: ProjectRecord[];
  nextInvoiceNumber: string;
  initialInvoice?: InvoiceRecord | null;
  lockedClientId?: string;
  lockedProjectId?: string;
}

export function InvoiceFormModal({
  isOpen,
  onClose,
  onSave,
  clients,
  projects,
  nextInvoiceNumber,
  initialInvoice,
  lockedClientId,
  lockedProjectId,
}: InvoiceFormModalProps) {
  const isEditing = Boolean(initialInvoice);
  const vm = useInvoiceForm({
    isOpen,
    onClose,
    onSave,
    clients,
    projects,
    initialInvoice,
    lockedClientId,
    lockedProjectId,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-overlay backdrop-blur-[6px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div className="w-full max-w-3xl sm:my-auto bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-lg overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="invoice-modal-title"
              className="font-heading text-lg font-semibold text-foreground truncate"
            >
              {isEditing ? `Edit Invoice ${initialInvoice?.invoiceNumber}` : 'Create Invoice'}
            </h2>
            <p className="text-xs text-muted mt-0.5 num">
              Invoice Number:{' '}
              <span className="font-mono font-semibold text-primary-600">
                {isEditing ? initialInvoice?.invoiceNumber : nextInvoiceNumber}
              </span>
            </p>
          </div>
          <button
            type="button"
            disabled={vm.isSubmitting}
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-muted hover:text-foreground hover:bg-surface-muted disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={vm.handleFormSubmit} className="p-6 space-y-5 overflow-y-auto" noValidate>
          {vm.submitError && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 flex items-start gap-2 text-xs font-medium text-danger-text"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{vm.submitError}</span>
            </div>
          )}

          <fieldset disabled={vm.isSubmitting} className="space-y-5 disabled:opacity-80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="inv-client"
                label="Client"
                disabled={Boolean(lockedClientId) || vm.isSubmitting}
                error={vm.errors.clientId?.message}
                className="disabled:opacity-70"
                {...vm.register('clientId')}
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.contactName})
                  </option>
                ))}
              </Select>

              <Select
                id="inv-project"
                label="Project"
                disabled={Boolean(lockedProjectId) || vm.isSubmitting}
                error={vm.errors.projectId?.message}
                className="disabled:opacity-70"
                {...vm.register('projectId')}
              >
                <option value="">
                  {vm.clientProjects.length === 0 ? 'No projects for this client' : 'Select project...'}
                </option>
                {vm.clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                id="inv-issue"
                type="date"
                label="Issue Date"
                error={vm.errors.issueDate?.message}
                {...vm.register('issueDate')}
              />
              <Input
                id="inv-due"
                type="date"
                label="Due Date"
                error={vm.errors.dueDate?.message}
                {...vm.register('dueDate')}
              />
              <div>
                <Select id="inv-status" label="Status" {...vm.register('status')}>
                  {INVOICE_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </Select>
                <p className="mt-1.5 text-xs text-muted">
                  Draft invoices remain hidden from clients.
                </p>
              </div>
            </div>

            <InvoiceLineItemsEditor
              fields={vm.fields}
              watchedItems={vm.watchedItems}
              errors={vm.errors}
              register={vm.register}
              disabled={vm.isSubmitting}
              onAdd={() => vm.append({description: '', quantity: 1, unitPrice: 0})}
              onRemove={(idx) => vm.remove(idx)}
            />

            <Textarea
              id="inv-notes"
              rows={2}
              label="Notes / Payment Instructions"
              placeholder="e.g. bKash Merchant / Bank transfer details or milestone billing notes..."
              error={vm.errors.notes?.message}
              {...vm.register('notes')}
            />
          </fieldset>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={vm.isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" loading={vm.isSubmitting}>
              {vm.isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
