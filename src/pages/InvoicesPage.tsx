import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {InvoiceFormModal} from '../components/InvoiceFormModal';
import {MarkPaidModal} from '../components/MarkPaidModal';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {queryKeys} from '../lib/queryKeys';
import {list as listClients} from '../services/clients';
import {
  create as createInvoice,
  list as listInvoices,
  markPaid as markInvoicePaid,
  remove as removeInvoice,
  update as updateInvoice,
} from '../services/invoices';
import {list as listPaymentSubmissions} from '../services/payments';
import {list as listProjects} from '../services/projects';
import {getErrorMessage} from '../services/serviceUtils';
import type {
  InvoiceFormParsed,
  InvoiceRecord,
  InvoiceStatus,
  MarkPaidFormParsed,
} from '../types/portal';
import {formatBDT, formatDateDisplay} from '../utils/format';
import {downloadInvoicePdf} from '../utils/invoicePdf';
import {
  generateNextInvoiceNumber,
  getEffectiveInvoiceStatus,
} from '../utils/invoices';
import {createNotification} from '../utils/notifications';

const STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  Draft:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  Sent:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Paid:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
  Overdue:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
};

export function InvoicesPage() {
  const {user} = useAuth();
  const {t} = useLanguage();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const clientFilterId = isAdmin ? undefined : user?.clientId || undefined;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [markingPaidInvoice, setMarkingPaidInvoice] = useState<InvoiceRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {
    data: invoices = [],
    isLoading: loading,
    error: invoicesError,
  } = useQuery({
    queryKey: queryKeys.invoices.list({clientId: clientFilterId}),
    queryFn: () =>
      listInvoices({
        clientId: clientFilterId,
        includeDrafts: isAdmin,
      }),
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

  const invalidateInvoices = async () => {
    await queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeInvoice(id),
    onSuccess: () => invalidateInvoices(),
  });

  const nextInvoiceNumber = useMemo(
    () => generateNextInvoiceNumber(invoices.map((i) => i.invoiceNumber)),
    [invoices],
  );

  const summary = useMemo(() => {
    let unpaidAmount = 0;
    let overdueAmount = 0;
    let paidAmount = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      const effective = getEffectiveInvoiceStatus(inv);
      if (effective === 'Paid') {
        paidAmount += inv.amount;
      } else if (effective === 'Overdue') {
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
    const lineItems = values.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      total: Math.round(li.quantity * li.unitPrice),
    }));
    const amount = lineItems.reduce((sum, li) => sum + li.total, 0);

    try {
      if (editingInvoice) {
        const updated = await updateInvoice(editingInvoice.id, {
          clientId: values.clientId,
          projectId: values.projectId,
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
        await invalidateInvoices();
        if (editingInvoice.status === 'Draft' && values.status !== 'Draft' && user) {
          await createNotification({
            recipientRole: 'client',
            clientId: values.clientId,
            projectId: values.projectId,
            type: 'invoice',
            title: `New invoice ${updated.invoiceNumber}`,
            body: `Amount: ${formatBDT(amount)} · Due ${formatDateDisplay(values.dueDate)}`,
            link: `/invoices/${updated.id}`,
            actorUid: user.id,
            actorName: user.name,
          });
        }
        return;
      }

      const created = await createInvoice({
        clientId: values.clientId,
        projectId: values.projectId,
        lineItems,
        totalBdt: amount,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        notes: values.notes,
        status: values.status,
      });
      await invalidateInvoices();
      if (values.status !== 'Draft' && user) {
        await createNotification({
          recipientRole: 'client',
          clientId: values.clientId,
          projectId: values.projectId,
          type: 'invoice',
          title: `New invoice ${created.invoiceNumber}`,
          body: `Amount: ${formatBDT(amount)} · Due ${formatDateDisplay(values.dueDate)}`,
          link: `/invoices/${created.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
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
      await markInvoicePaid(invoice.id, values.paymentMethod, values.paymentReference);
      await invalidateInvoices();
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
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to mark invoice as paid.'));
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!isAdmin) return;
    setPaymentError(null);
    setDeletingId(invoiceId);
    try {
      await deleteMutation.mutateAsync(invoiceId);
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

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Invoices
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Create BDT invoices, record bKash/Nagad/Bank/Cash payments, and download PDF statements.'
              : 'Review your Stack Dev billing statements, due dates, and downloadable PDF invoices.'}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingInvoice(null);
              setIsModalOpen(true);
            }}
            disabled={clients.length === 0 || projects.length === 0}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{t.actions.createInvoice}</span>
          </button>
        )}
      </div>

      {displayedError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{displayedError}</span>
          </div>
          {paymentError && (
            <button
              type="button"
              onClick={() => setPaymentError(null)}
              aria-label="Dismiss payment error"
              className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Unpaid Balance
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {formatBDT(summary.unpaidAmount)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Overdue ({summary.overdueCount})
          </p>
          <p
            className={`mt-2 text-2xl font-bold tabular-nums ${
              summary.overdueCount > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formatBDT(summary.overdueAmount)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Paid
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatBDT(summary.paidAmount)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterStatuses.map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, client, project..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText
              className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {invoices.length === 0 ? 'No invoices found' : 'No matching invoices'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {invoices.length === 0
                ? isAdmin
                  ? 'Create your first invoice to start billing clients in BDT.'
                  : 'Published invoices from Stack Dev will appear here.'
                : 'Try adjusting your status filter or search query.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-6">Invoice #</th>
                    {isAdmin && <th className="py-3 px-4">Client</th>}
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {filteredInvoices.map((inv) => {
                    const effectiveStatus = getEffectiveInvoiceStatus(inv);
                    const hasPendingReview =
                      effectiveStatus !== 'Paid' && pendingInvoiceIds.has(inv.id);
                    const isConfirming = confirmDeleteId === inv.id;
                    const isDeleting = deletingId === inv.id;

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-6 font-semibold whitespace-nowrap tabular-nums">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                            {inv.clientName}
                          </td>
                        )}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {inv.projectTitle}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                          {formatBDT(inv.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                          {formatDateDisplay(inv.dueDate)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE_CLASSES[effectiveStatus]}`}
                            >
                              {effectiveStatus}
                            </span>
                            {hasPendingReview && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                Payment under review
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          {isConfirming ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                              >
                                {isDeleting ? 'Deleting...' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <Link
                                to={`/invoices/${inv.id}`}
                                title="View / Print Invoice"
                                aria-label={`View ${inv.invoiceNumber}`}
                                className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              >
                                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => downloadInvoicePdf(inv)}
                                title={t.actions.downloadPdf}
                                aria-label={`Download PDF for ${inv.invoiceNumber}`}
                                className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              >
                                <Download className="w-4 h-4" aria-hidden="true" />
                              </button>
                              {!isAdmin && effectiveStatus !== 'Paid' && inv.amount > 0 && (
                                <Link
                                  to={`/invoices/${inv.id}#pay-now`}
                                  className="ml-1 inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
                                >
                                  <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{hasPendingReview ? 'Reviewing' : t.actions.payOnline}</span>
                                </Link>
                              )}
                              {isAdmin && effectiveStatus !== 'Paid' && (
                                <button
                                  type="button"
                                  onClick={() => setMarkingPaidInvoice(inv)}
                                  title={t.actions.markPaid}
                                  className="ml-1 inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{t.actions.markPaid}</span>
                                </button>
                              )}
                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingInvoice(inv);
                                      setIsModalOpen(true);
                                    }}
                                    aria-label={`Edit ${inv.invoiceNumber}`}
                                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                  >
                                    <Pencil className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(inv.id)}
                                    aria-label={`Delete ${inv.invoiceNumber}`}
                                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <ul className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {filteredInvoices.map((inv) => {
                const effectiveStatus = getEffectiveInvoiceStatus(inv);
                const hasPendingReview =
                  effectiveStatus !== 'Paid' && pendingInvoiceIds.has(inv.id);
                return (
                  <li key={inv.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tabular-nums"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {isAdmin ? `${inv.clientName} · ` : ''}
                          {inv.projectTitle}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE_CLASSES[effectiveStatus]}`}
                        >
                          {effectiveStatus}
                        </span>
                        {hasPendingReview && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            Payment under review
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatBDT(inv.amount)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Due {formatDateDisplay(inv.dueDate)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.actions.view}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => downloadInvoicePdf(inv)}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.actions.downloadPdf}</span>
                      </button>
                      {!isAdmin && effectiveStatus !== 'Paid' && inv.amount > 0 && (
                        <Link
                          to={`/invoices/${inv.id}#pay-now`}
                          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm whitespace-nowrap"
                        >
                          <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{hasPendingReview ? 'Reviewing' : t.actions.payOnline}</span>
                        </Link>
                      )}
                      {isAdmin && effectiveStatus !== 'Paid' && (
                        <button
                          type="button"
                          onClick={() => setMarkingPaidInvoice(inv)}
                          className="inline-flex items-center gap-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t.actions.markPaid}</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {isAdmin && (
        <>
          <InvoiceFormModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingInvoice(null);
            }}
            onSave={handleSaveInvoice}
            clients={clients}
            projects={projects}
            nextInvoiceNumber={nextInvoiceNumber}
            initialInvoice={editingInvoice}
          />
          <MarkPaidModal
            invoice={markingPaidInvoice}
            onClose={() => setMarkingPaidInvoice(null)}
            onConfirm={handleConfirmMarkPaid}
          />
        </>
      )}
    </section>
  );
}
