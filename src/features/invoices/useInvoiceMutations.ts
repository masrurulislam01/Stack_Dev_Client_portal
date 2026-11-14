import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useCallback} from 'react';
import type {PortalUser} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as createInvoice,
  markPaid as markInvoicePaid,
  remove as removeInvoice,
  update as updateInvoice,
} from '@/services/invoices';
import type {
  InvoiceFormParsed,
  InvoiceRecord,
  MarkPaidFormParsed,
} from '@/types/portal';
import {formatBDT, formatDateDisplay} from '@/utils/format';
import {createNotification} from '@/utils/notifications';

interface SaveInvoiceParams {
  values: InvoiceFormParsed;
  editingInvoice?: InvoiceRecord | null;
  lockedProjectId?: string;
  user: PortalUser | null;
}

interface MarkPaidParams {
  invoice: InvoiceRecord;
  values: MarkPaidFormParsed;
  user: PortalUser | null;
}

export function useInvoiceMutations(detailInvoiceId?: string) {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(async () => {
    const tasks: Promise<void>[] = [
      queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix}),
      queryClient.invalidateQueries({queryKey: queryKeys.payments.prefix}),
    ];
    if (detailInvoiceId) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: queryKeys.invoices.detail(detailInvoiceId),
        }),
      );
    }
    await Promise.all(tasks);
  }, [queryClient, detailInvoiceId]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeInvoice(id),
    onSuccess: () => invalidateAll(),
  });

  const saveInvoice = useCallback(
    async ({values, editingInvoice, lockedProjectId, user}: SaveInvoiceParams) => {
      const targetProjectId = lockedProjectId ?? values.projectId;
      const lineItems = values.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        total: Math.round(li.quantity * li.unitPrice),
      }));
      const amount = lineItems.reduce((sum, li) => sum + li.total, 0);

      if (editingInvoice) {
        const updated = await updateInvoice(editingInvoice.id, {
          clientId: values.clientId,
          projectId: targetProjectId,
          lineItems,
          totalBdt: amount,
          issueDate: values.issueDate,
          dueDate: values.dueDate,
          notes: values.notes,
          status: values.status,
          paymentMethod:
            values.status === 'Paid' ? editingInvoice.paymentMethod || 'Bank' : null,
          paymentReference:
            values.status === 'Paid' ? editingInvoice.paymentReference : null,
          paidAt:
            values.status === 'Paid'
              ? typeof editingInvoice.paidAt === 'string'
                ? editingInvoice.paidAt
                : new Date().toISOString()
              : null,
        });
        await invalidateAll();

        if (editingInvoice.status === 'Draft' && values.status !== 'Draft' && user) {
          await createNotification({
            recipientRole: 'client',
            clientId: values.clientId,
            projectId: targetProjectId,
            type: 'invoice',
            title: `New invoice ${updated.invoiceNumber}`,
            body: `Amount: ${formatBDT(amount)} · Due ${formatDateDisplay(values.dueDate)}`,
            link: `/invoices/${updated.id}`,
            actorUid: user.id,
            actorName: user.name,
          });
        }
        return updated;
      }

      const created = await createInvoice({
        clientId: values.clientId,
        projectId: targetProjectId,
        lineItems,
        totalBdt: amount,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        notes: values.notes,
        status: values.status,
      });
      await invalidateAll();

      if (values.status !== 'Draft' && user) {
        await createNotification({
          recipientRole: 'client',
          clientId: values.clientId,
          projectId: targetProjectId,
          type: 'invoice',
          title: `New invoice ${created.invoiceNumber}`,
          body: `Amount: ${formatBDT(amount)} · Due ${formatDateDisplay(values.dueDate)}`,
          link: `/invoices/${created.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
      return created;
    },
    [invalidateAll],
  );

  const markPaid = useCallback(
    async ({invoice, values, user}: MarkPaidParams) => {
      await markInvoicePaid(invoice.id, values.paymentMethod, values.paymentReference);
      await invalidateAll();
      if (user) {
        await createNotification({
          recipientRole: 'client',
          clientId: invoice.clientId,
          projectId: invoice.projectId,
          type: 'invoice',
          title: `Payment recorded: ${invoice.invoiceNumber}`,
          body: `${formatBDT(invoice.amount)} marked paid via ${values.paymentMethod}.`,
          link: `/invoices/${invoice.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
    },
    [invalidateAll],
  );

  return {
    saveInvoice,
    markPaid,
    deleteInvoice: (id: string) => deleteMutation.mutateAsync(id),
    invalidateAll,
  };
}
