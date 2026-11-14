import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect, useMemo} from 'react';
import {useFieldArray, useForm} from 'react-hook-form';
import {useEscapeKey} from '@/hooks/useEscapeKey';
import type {
  ClientRecord,
  InvoiceFormParsed,
  InvoiceFormValues,
  InvoiceRecord,
  ProjectRecord,
} from '@/types/portal';
import {invoiceFormSchema} from '@/types/schemas';
import {getTodayIsoDate} from '@/utils/invoices';

interface UseInvoiceFormArgs {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: InvoiceFormParsed) => Promise<void>;
  clients: ClientRecord[];
  projects: ProjectRecord[];
  initialInvoice?: InvoiceRecord | null;
  lockedClientId?: string;
  lockedProjectId?: string;
}

export function useInvoiceForm({
  isOpen,
  onClose,
  onSave,
  clients,
  projects,
  initialInvoice,
  lockedClientId,
  lockedProjectId,
}: UseInvoiceFormArgs) {
  const defaultIssue = getTodayIsoDate();
  const defaultDue = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const form = useForm<InvoiceFormValues, unknown, InvoiceFormParsed>({
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

  const {control, watch, setValue, reset, formState} = form;
  const {fields, append, remove} = useFieldArray({control, name: 'lineItems'});

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
        lockedProjectId || projects.find((p) => p.clientId === firstClientId)?.id || '';
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

  useEffect(() => {
    if (!isOpen || lockedProjectId) return;
    const currentProjectId = watch('projectId');
    if (!clientProjects.some((p) => p.id === currentProjectId)) {
      setValue('projectId', clientProjects[0]?.id ?? '');
    }
  }, [selectedClientId, clientProjects, isOpen, lockedProjectId, setValue, watch]);

  useEscapeKey(isOpen && !formState.isSubmitting, onClose);

  const handleFormSubmit = form.handleSubmit(async (values: InvoiceFormParsed) => {
    await onSave(values);
    onClose();
  });

  return {
    register: form.register,
    errors: formState.errors,
    isSubmitting: formState.isSubmitting,
    fields,
    append,
    remove,
    watchedItems,
    clientProjects,
    handleFormSubmit,
  };
}
