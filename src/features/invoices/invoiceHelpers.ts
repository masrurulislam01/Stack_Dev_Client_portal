import {queryKeys} from '@/lib/queryKeys';
import {
  create as createInvoice,
  markPaid as markInvoicePaid,
  update as updateInvoice,
} from '@/services/invoices';
import type {
  InvoiceFormParsed,
  InvoiceRecord,
  MarkPaidFormParsed,
} from '@/types/portal';
import {formatBDT, formatDateDisplay} from '@/utils/format';
import {createNotification} from '@/utils/notifications';
import type {QueryClient} from '@tanstack/react-query';

export async function saveInvoiceAndNotify(params: {
  values: InvoiceFormParsed;
  editingInvoice: InvoiceRecord | null;
  projectIdOverride?: string;
  actor: {id: string; name: string};
  queryClient: QueryClient;
}): Promise<InvoiceRecord> {
  const {values, editingInvoice, projectIdOverride, actor, queryClient} = params;
  const targetProjectId = projectIdOverride ?? values.projectId;
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
    await Promise.all([
      queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix}),
      queryClient.invalidateQueries({queryKey: queryKeys.invoices.detail(editingInvoice.id)}),
    ]);
    if (editingInvoice.status === 'Draft' && values.status !== 'Draft') {
      await createNotification({
        recipientRole: 'client',
        clientId: values.clientId,
        projectId: targetProjectId,
        type: 'invoice',
        title: `New invoice ${updated.invoiceNumber}`,
        body: `Amount: ${formatBDT(amount)} · Due ${formatDateDisplay(values.dueDate)}`,
        link: `/invoices/${updated.id}`,
        actorUid: actor.id,
        actorName: actor.name,
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
  await queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
  if (values.status !== 'Draft') {
    await createNotification({
      recipientRole: 'client',
      clientId: values.clientId,
      projectId: targetProjectId,
      type: 'invoice',
      title: `New invoice ${created.invoiceNumber}`,
      body: `Amount: ${formatBDT(amount)} · Due ${formatDateDisplay(values.dueDate)}`,
      link: `/invoices/${created.id}`,
      actorUid: actor.id,
      actorName: actor.name,
    });
  }
  return created;
}

export async function markPaidAndNotify(params: {
  invoice: InvoiceRecord;
  values: MarkPaidFormParsed;
  actor: {id: string; name: string};
  queryClient: QueryClient;
}): Promise<void> {
  const {invoice, values, actor, queryClient} = params;
  await markInvoicePaid(invoice.id, values.paymentMethod, values.paymentReference);
  await Promise.all([
    queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix}),
    queryClient.invalidateQueries({queryKey: queryKeys.invoices.detail(invoice.id)}),
  ]);
  await createNotification({
    recipientRole: 'client',
    clientId: invoice.clientId,
    projectId: invoice.projectId,
    type: 'invoice',
    title: `Payment recorded: ${invoice.invoiceNumber}`,
    body: `${formatBDT(invoice.amount)} marked paid via ${values.paymentMethod}.`,
    link: `/invoices/${invoice.id}`,
    actorUid: actor.id,
    actorName: actor.name,
  });
}
