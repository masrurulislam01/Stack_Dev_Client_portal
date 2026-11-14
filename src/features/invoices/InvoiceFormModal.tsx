import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect, useMemo} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Input, Modal, Select, Textarea} from '@/components/ui';
import {InvoiceLineItemsEditor} from '@/features/invoices/InvoiceLineItemsEditor';
import {INVOICE_STATUSES} from '@/lib/constants';
import {
  invoiceFormSchema,
  type ClientRecord,
  type InvoiceFormParsed,
  type InvoiceFormValues,
  type InvoiceRecord,
  type ProjectRecord,
} from '@/types/portal';
import {getTodayIsoDate} from '@/utils/invoices';

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
      const firstProjectId =
        lockedProjectId || projects.find((p) => p.clientId === firstClientId)?.id || '';
      reset({
        clientId: firstClientId,
        projectId: firstProjectId,
        issueDate: defaultIssue,
        dueDate: defaultDue,
        status: 'Sent',
        notes: '',
        lineItems: [{description: '', quantity: 1, unitPrice: 0}],
      });
    }
  }, [isOpen, initialInvoice, clients, projects, lockedClientId, lockedProjectId, defaultIssue, defaultDue, reset]);

  const selectedClientId = watch('clientId');
  const watchedItems = watch('lineItems');
  const clientProjects = useMemo(
    () => projects.filter((p) => p.clientId === selectedClientId),
    [projects, selectedClientId],
  );

  useEffect(() => {
    if (!isOpen || lockedProjectId) return;
    const currentProjectId = watch('projectId');
    if (!clientProjects.some((p) => p.id === currentProjectId)) {
      setValue('projectId', clientProjects[0]?.id ?? '');
    }
  }, [selectedClientId, clientProjects, isOpen, lockedProjectId, setValue, watch]);

  const onSubmit = async (values: InvoiceFormParsed) => {
    await onSave(values);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Invoice ${initialInvoice?.invoiceNumber}` : 'Create Invoice'}
      subtitle={
        <>
          Invoice Number:{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {isEditing ? initialInvoice?.invoiceNumber : nextInvoiceNumber}
          </span>
        </>
      }
      size="xl"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="inv-client"
            label="Client"
            disabled={Boolean(lockedClientId)}
            error={errors.clientId?.message}
            {...register('clientId')}
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
            disabled={Boolean(lockedProjectId)}
            error={errors.projectId?.message}
            {...register('projectId')}
          >
            <option value="">
              {clientProjects.length === 0 ? 'No projects for this client' : 'Select project...'}
            </option>
            {clientProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="inv-issue"
            label="Issue Date"
            type="date"
            error={errors.issueDate?.message}
            {...register('issueDate')}
          />

          <Input
            id="inv-due"
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <Select
            id="inv-status"
            label="Status"
            hint="Draft invoices remain hidden from clients."
            {...register('status')}
          >
            {INVOICE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
        </div>

        <InvoiceLineItemsEditor
          control={control}
          register={register}
          errors={errors}
          watchedItems={watchedItems}
        />

        <Textarea
          id="inv-notes"
          label="Notes / Payment Instructions"
          rows={2}
          placeholder="e.g. bKash Merchant / Bank transfer details or milestone billing notes..."
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
