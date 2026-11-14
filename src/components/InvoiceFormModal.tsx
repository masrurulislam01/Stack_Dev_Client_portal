import {zodResolver} from '@hookform/resolvers/zod';
import {Plus, Trash2, X} from 'lucide-react';
import {useEffect, useMemo} from 'react';
import {useFieldArray, useForm} from 'react-hook-form';
import {
  INVOICE_STATUSES,
  invoiceFormSchema,
  type ClientRecord,
  type InvoiceFormParsed,
  type InvoiceFormValues,
  type InvoiceRecord,
  type ProjectRecord,
} from '../types/portal';
import {formatBDT} from '../utils/format';
import {getTodayIsoDate} from '../utils/invoices';

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

  const defaultIssue = getTodayIsoDate();
  const defaultDue = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<InvoiceFormValues, unknown, InvoiceFormParsed>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: lockedClientId ?? '',
      projectId: lockedProjectId ?? '',
      issueDate: defaultIssue,
      dueDate: defaultDue,
      status: 'Sent',
      notes: '',
      lineItems: [{description: '', quantity: 1, unitPrice: 0}],
    },
  });

  const {fields, append, remove} = useFieldArray({
    control,
    name: 'lineItems',
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialInvoice) {
      reset({
        clientId: initialInvoice.clientId,
        projectId: initialInvoice.projectId,
        issueDate: initialInvoice.issueDate,
        dueDate: initialInvoice.dueDate,
        status: initialInvoice.status,
        notes: initialInvoice.notes,
        lineItems:
          initialInvoice.lineItems.length > 0
            ? initialInvoice.lineItems.map((li) => ({
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
              }))
            : [{description: '', quantity: 1, unitPrice: initialInvoice.amount}],
      });
    } else {
      const firstClientId = lockedClientId || clients[0]?.id || '';
      const firstMatchingProject =
        lockedProjectId ||
        projects.find((p) => p.clientId === firstClientId)?.id ||
        '';
      reset({
        clientId: firstClientId,
        projectId: firstMatchingProject,
        issueDate: defaultIssue,
        dueDate: defaultDue,
        status: 'Sent',
        notes: '',
        lineItems: [{description: '', quantity: 1, unitPrice: 0}],
      });
    }
  }, [
    isOpen,
    initialInvoice,
    clients,
    projects,
    lockedClientId,
    lockedProjectId,
    defaultIssue,
    defaultDue,
    reset,
  ]);

  const selectedClientId = watch('clientId');
  const watchedItems = watch('lineItems');

  const clientProjects = useMemo(
    () => projects.filter((p) => p.clientId === selectedClientId),
    [projects, selectedClientId],
  );

  // Ensure selected project belongs to selected client
  useEffect(() => {
    if (!isOpen || lockedProjectId) return;
    const currentProjectId = watch('projectId');
    const stillValid = clientProjects.some((p) => p.id === currentProjectId);
    if (!stillValid) {
      setValue('projectId', clientProjects[0]?.id ?? '');
    }
  }, [selectedClientId, clientProjects, isOpen, lockedProjectId, setValue, watch]);

  const computedTotal = (watchedItems ?? []).reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 0);
    const price = Number(item?.unitPrice ?? 0);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum;
    return sum + Math.max(0, qty) * Math.max(0, price);
  }, 0);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (values: InvoiceFormParsed) => {
    await onSave(values);
    onClose();
  };

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
            <h3
              id="invoice-modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="inv-client"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Client
              </label>
              <select
                id="inv-client"
                disabled={Boolean(lockedClientId)}
                {...register('clientId')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-70 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.contactName})
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.clientId.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="inv-project"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Project
              </label>
              <select
                id="inv-project"
                disabled={Boolean(lockedProjectId)}
                {...register('projectId')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-70 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              >
                <option value="">
                  {clientProjects.length === 0 ? 'No projects for this client' : 'Select project...'}
                </option>
                {clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.projectId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="inv-issue"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Issue Date
              </label>
              <input
                id="inv-issue"
                type="date"
                {...register('issueDate')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              {errors.issueDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.issueDate.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="inv-due"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Due Date
              </label>
              <input
                id="inv-due"
                type="date"
                {...register('dueDate')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.dueDate.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="inv-status"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Status
              </label>
              <select
                id="inv-status"
                {...register('status')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              >
                {INVOICE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Draft invoices remain hidden from clients.
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Line Items (BDT)
              </label>
              <button
                type="button"
                onClick={() => append({description: '', quantity: 1, unitPrice: 0})}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {fields.map((field, index) => {
                const qty = Number(watchedItems?.[index]?.quantity ?? 0);
                const price = Number(watchedItems?.[index]?.unitPrice ?? 0);
                const rowTotal =
                  Number.isFinite(qty) && Number.isFinite(price)
                    ? Math.max(0, qty) * Math.max(0, price)
                    : 0;
                const itemErrors = errors.lineItems?.[index];

                return (
                  <div
                    key={field.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-3 space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          aria-label={`Line item ${index + 1} description`}
                          placeholder="e.g. Flutter App Milestone 1 - Auth & UI"
                          {...register(`lineItems.${index}.description`)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
                        />
                        {itemErrors?.description && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {itemErrors.description.message}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min={1}
                          step="1"
                          aria-label={`Line item ${index + 1} quantity`}
                          placeholder="Qty"
                          {...register(`lineItems.${index}.quantity`)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-indigo-600"
                        />
                        {itemErrors?.quantity && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {itemErrors.quantity.message}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          min={0}
                          step="1"
                          aria-label={`Line item ${index + 1} unit price in BDT`}
                          placeholder="Unit Price (৳)"
                          {...register(`lineItems.${index}.unitPrice`)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-indigo-600"
                        />
                        {itemErrors?.unitPrice && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {itemErrors.unitPrice.message}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 pt-1.5">
                        <span className="sm:hidden text-xs font-medium text-slate-500">
                          {formatBDT(rowTotal)}
                        </span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={`Remove line item ${index + 1}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex justify-end text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      Line total:{' '}
                      <span className="ml-1 font-semibold text-slate-900 dark:text-slate-100">
                        {formatBDT(rowTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.lineItems?.message && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.lineItems.message}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 px-4 py-3">
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                Invoice Total:
              </span>
              <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                {formatBDT(computedTotal)}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="inv-notes"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Notes / Payment Instructions
            </label>
            <textarea
              id="inv-notes"
              rows={2}
              {...register('notes')}
              placeholder="e.g. bKash Merchant / Bank transfer details or milestone billing notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.notes.message}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
