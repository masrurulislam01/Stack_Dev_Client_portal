import {X} from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 id="invoice-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isEditing ? `Edit Invoice ${initialInvoice?.invoiceNumber}` : 'Create Invoice'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              Invoice Number:{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {isEditing ? initialInvoice?.invoiceNumber : nextInvoiceNumber}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={vm.handleFormSubmit} className="p-6 space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-client" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Client
              </label>
              <select
                id="inv-client"
                disabled={Boolean(lockedClientId)}
                {...vm.register('clientId')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-70 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.contactName})
                  </option>
                ))}
              </select>
              {vm.errors.clientId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{vm.errors.clientId.message}</p>}
            </div>

            <div>
              <label htmlFor="inv-project" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Project
              </label>
              <select
                id="inv-project"
                disabled={Boolean(lockedProjectId)}
                {...vm.register('projectId')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-70 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              >
                <option value="">
                  {vm.clientProjects.length === 0 ? 'No projects for this client' : 'Select project...'}
                </option>
                {vm.clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {vm.errors.projectId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{vm.errors.projectId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="inv-issue" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Issue Date</label>
              <input id="inv-issue" type="date" {...vm.register('issueDate')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20" />
              {vm.errors.issueDate && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{vm.errors.issueDate.message}</p>}
            </div>
            <div>
              <label htmlFor="inv-due" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
              <input id="inv-due" type="date" {...vm.register('dueDate')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20" />
              {vm.errors.dueDate && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{vm.errors.dueDate.message}</p>}
            </div>
            <div>
              <label htmlFor="inv-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select id="inv-status" {...vm.register('status')} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20">
                {INVOICE_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Draft invoices remain hidden from clients.</p>
            </div>
          </div>

          <InvoiceLineItemsEditor
            fields={vm.fields}
            watchedItems={vm.watchedItems}
            errors={vm.errors}
            register={vm.register}
            onAdd={() => vm.append({description: '', quantity: 1, unitPrice: 0})}
            onRemove={(idx) => vm.remove(idx)}
          />

          <div>
            <label htmlFor="inv-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes / Payment Instructions</label>
            <textarea id="inv-notes" rows={2} {...vm.register('notes')} placeholder="e.g. bKash Merchant / Bank transfer details or milestone billing notes..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y" />
            {vm.errors.notes && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{vm.errors.notes.message}</p>}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" disabled={vm.isSubmitting} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors">
              {vm.isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
