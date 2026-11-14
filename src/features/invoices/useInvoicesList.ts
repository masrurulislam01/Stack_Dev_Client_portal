import {useQuery} from '@tanstack/react-query';
import {useMemo, useState} from 'react';
import type {InvoiceStatus} from '@/config/constants';
import type {InvoiceSummaryMetrics} from '@/features/invoices/InvoiceMetricsStrip';
import {useInvoiceMutations} from '@/features/invoices/useInvoiceMutations';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {list as listClients} from '@/services/clients';
import {list as listInvoices} from '@/services/invoices';
import {list as listPaymentSubmissions} from '@/services/payments';
import {list as listProjects} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  InvoiceFormParsed,
  InvoiceRecord,
  MarkPaidFormParsed,
} from '@/types/portal';
import {
  generateNextInvoiceNumber,
  getEffectiveInvoiceStatus,
} from '@/utils/invoices';

export function useInvoicesList() {
  const {user} = useAuth();
  const isAdmin = user?.role === 'admin';
  const clientFilterId = isAdmin ? undefined : user?.clientId || undefined;
  const {saveInvoice, markPaid, deleteInvoice} = useInvoiceMutations();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [markingPaidInvoice, setMarkingPaidInvoice] = useState<InvoiceRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {data: invoices = [], isLoading: loading, error: invoicesError} = useQuery({
    queryKey: queryKeys.invoices.list({clientId: clientFilterId}),
    queryFn: () => listInvoices({clientId: clientFilterId, includeDrafts: isAdmin}),
    enabled: Boolean(user && (isAdmin || user.clientId)),
  });

  const {data: pendingPayments = []} = useQuery({
    queryKey: queryKeys.payments.list('pending'),
    queryFn: () => listPaymentSubmissions({status: 'Pending'}),
    enabled: Boolean(user && (isAdmin || user.clientId)),
  });

  const pendingInvoiceIds = useMemo(
    () => new Set(pendingPayments.map((p) => p.invoiceId)),
    [pendingPayments],
  );

  const {data: clients = []} = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => listClients(),
    enabled: isAdmin,
  });

  const {data: projects = []} = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const list = await listProjects();
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    },
    enabled: isAdmin,
  });

  const nextInvoiceNumber = useMemo(
    () => generateNextInvoiceNumber(invoices.map((i) => i.invoiceNumber)),
    [invoices],
  );

  const summary = useMemo<InvoiceSummaryMetrics>(() => {
    let unpaidAmount = 0;
    let overdueAmount = 0;
    let paidAmount = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      const effective = getEffectiveInvoiceStatus(inv);
      if (effective === 'Paid') paidAmount += inv.amount;
      else if (effective === 'Overdue') {
        unpaidAmount += inv.amount;
        overdueAmount += inv.amount;
        overdueCount += 1;
      } else if (effective === 'Sent') {
        unpaidAmount += inv.amount;
      }
    }
    return {unpaidAmount, overdueAmount, paidAmount, overdueCount};
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const effective = getEffectiveInvoiceStatus(inv);
      if (statusFilter !== 'ALL' && effective !== statusFilter) return false;
      if (!term) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.clientName.toLowerCase().includes(term) ||
        inv.projectTitle.toLowerCase().includes(term)
      );
    });
  }, [invoices, search, statusFilter]);

  const handleSaveInvoice = async (values: InvoiceFormParsed) => {
    if (!isAdmin) return;
    setPaymentError(null);
    try {
      await saveInvoice({values, editingInvoice, user});
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to save invoice.'));
      throw err;
    }
  };

  const handleConfirmMarkPaid = async (
    invoice: InvoiceRecord,
    values: MarkPaidFormParsed,
  ) => {
    if (!isAdmin) return;
    setPaymentError(null);
    try {
      await markPaid({invoice, values, user});
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to mark invoice as paid.'));
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!isAdmin) return;
    setPaymentError(null);
    setDeletingId(invoiceId);
    try {
      await deleteInvoice(invoiceId);
      setConfirmDeleteId(null);
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to delete invoice.'));
    } finally {
      setDeletingId(null);
    }
  };

  const filterStatuses: ('ALL' | InvoiceStatus)[] = isAdmin
    ? ['ALL', 'Draft', 'Sent', 'Overdue', 'Paid']
    : ['ALL', 'Sent', 'Overdue', 'Paid'];

  const displayedError =
    paymentError ||
    (invoicesError ? getErrorMessage(invoicesError, 'Unable to load invoices.') : null);

  return {
    isAdmin,
    invoices,
    filteredInvoices,
    loading,
    clients,
    projects,
    nextInvoiceNumber,
    summary,
    pendingInvoiceIds,
    filterStatuses,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    editingInvoice,
    setEditingInvoice,
    markingPaidInvoice,
    setMarkingPaidInvoice,
    confirmDeleteId,
    setConfirmDeleteId,
    deletingId,
    paymentError,
    setPaymentError,
    displayedError,
    handleSaveInvoice,
    handleConfirmMarkPaid,
    handleDeleteInvoice,
  };
}
