import {useQuery} from '@tanstack/react-query';
import {useMemo, useState} from 'react';
import {useInvoiceMutations} from '@/features/invoices/useInvoiceMutations';
import type {PortalUser} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {list as listInvoices} from '@/services/invoices';
import {list as listPaymentSubmissions} from '@/services/payments';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  ClientRecord,
  InvoiceFormParsed,
  InvoiceRecord,
  MarkPaidFormParsed,
  ProjectRecord,
} from '@/types/portal';
import {generateNextInvoiceNumber} from '@/utils/invoices';

export function useProjectInvoices(
  project: ProjectRecord,
  user: PortalUser,
  clients: ClientRecord[],
) {
  const isAdmin = user.role === 'admin';
  const {saveInvoice, markPaid, deleteInvoice} = useInvoiceMutations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [markingPaidInvoice, setMarkingPaidInvoice] = useState<InvoiceRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {data: invoices = [], isLoading: loading} = useQuery({
    queryKey: queryKeys.invoices.list({projectId: project.id}),
    queryFn: () => listInvoices({projectId: project.id, includeDrafts: isAdmin}),
  });

  const {data: pendingPayments = []} = useQuery({
    queryKey: queryKeys.payments.list('pending'),
    queryFn: () => listPaymentSubmissions({status: 'Pending'}),
  });

  const pendingInvoiceIds = useMemo(
    () => new Set(pendingPayments.map((p) => p.invoiceId)),
    [pendingPayments],
  );

  const {data: allInvoicesForNumbers = []} = useQuery({
    queryKey: queryKeys.invoices.list(),
    queryFn: () => listInvoices(),
    enabled: isAdmin,
  });

  const nextInvoiceNumber = useMemo(
    () => generateNextInvoiceNumber(allInvoicesForNumbers.map((i) => i.invoiceNumber)),
    [allInvoicesForNumbers],
  );

  const resolvedClients: ClientRecord[] = useMemo(() => {
    if (clients.length > 0) return clients;
    return [
      {
        id: project.clientId,
        companyName: project.clientName || project.clientId,
        contactName: project.clientName || project.clientId,
        phone: '',
        email: '',
        notes: '',
        hasLoginAccount: true,
      },
    ];
  }, [clients, project.clientId, project.clientName]);

  const handleSaveInvoice = async (values: InvoiceFormParsed) => {
    if (!isAdmin) return;
    setActionError(null);
    try {
      await saveInvoice({
        values,
        editingInvoice,
        lockedProjectId: project.id,
        user,
      });
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to save invoice.'));
      throw err;
    }
  };

  const handleConfirmMarkPaid = async (
    invoice: InvoiceRecord,
    values: MarkPaidFormParsed,
  ) => {
    if (!isAdmin) return;
    setActionError(null);
    try {
      await markPaid({invoice, values, user});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to mark invoice paid.'));
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!isAdmin) return;
    setActionError(null);
    setDeletingId(invoiceId);
    try {
      await deleteInvoice(invoiceId);
      setConfirmDeleteId(null);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to delete invoice.'));
    } finally {
      setDeletingId(null);
    }
  };

  return {
    isAdmin,
    invoices,
    loading,
    pendingInvoiceIds,
    nextInvoiceNumber,
    resolvedClients,
    isModalOpen,
    setIsModalOpen,
    editingInvoice,
    setEditingInvoice,
    markingPaidInvoice,
    setMarkingPaidInvoice,
    confirmDeleteId,
    setConfirmDeleteId,
    deletingId,
    actionError,
    setActionError,
    handleSaveInvoice,
    handleConfirmMarkPaid,
    handleDeleteInvoice,
  };
}
