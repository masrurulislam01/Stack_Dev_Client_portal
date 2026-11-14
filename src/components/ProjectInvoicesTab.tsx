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
  Trash2,
  X,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import type {PortalUser} from '../context/AuthContext';
import {queryKeys} from '../lib/queryKeys';
import {
  create as createInvoice,
  list as listInvoices,
  markPaid as markInvoicePaid,
  remove as deleteInvoice,
  update as updateInvoice,
} from '../services/invoices';
import {list as listPaymentSubmissions} from '../services/payments';
import type {
  ClientRecord,
  InvoiceFormParsed,
  InvoiceRecord,
  InvoiceStatus,
  MarkPaidFormParsed,
  ProjectRecord,
} from '../types/portal';
import {formatBDT, formatDateDisplay} from '../utils/format';
import {downloadInvoicePdf} from '../utils/invoicePdf';
import {
  generateNextInvoiceNumber,
  getEffectiveInvoiceStatus,
} from '../utils/invoices';
import {createNotification} from '../utils/notifications';
import {InvoiceFormModal} from './InvoiceFormModal';
import {MarkPaidModal} from './MarkPaidModal';

interface ProjectInvoicesTabProps {
  project: ProjectRecord;
  user: PortalUser;
  clients?: ClientRecord[];
}

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

export function ProjectInvoicesTab({
  project,
  user,
  clients = [],
}: ProjectInvoicesTabProps) {
  const isAdmin = user.role === 'admin';
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [markingPaidInvoice, setMarkingPaidInvoice] = useState<InvoiceRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {data: invoices = [], isLoading: loading} = useQuery({
    queryKey: queryKeys.invoices.list({projectId: project.id}),
    queryFn: () =>
      listInvoices({
        projectId: project.id,
        includeDrafts: isAdmin,
      }),
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
    () =>
      generateNextInvoiceNumber(
        allInvoicesForNumbers.map((i) => i.invoiceNumber),
      ),
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

  const invalidateInvoices = async () => {
    await queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => invalidateInvoices(),
  });

  const handleSaveInvoice = async (values: InvoiceFormParsed) => {
    if (!isAdmin) return;
    setActionError(null);

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
          projectId: project.id,
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

        if (editingInvoice.status === 'Draft' && values.status !== 'Draft') {
          await createNotification({
            recipientRole: 'client',
            clientId: values.clientId,
            projectId: project.id,
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
        projectId: project.id,
        lineItems,
        totalBdt: amount,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        notes: values.notes,
        status: values.status,
      });

      await invalidateInvoices();

      if (values.status !== 'Draft') {
        await createNotification({
          recipientRole: 'client',
          clientId: values.clientId,
          projectId: project.id,
          type: 'invoice',
          title: `New invoice ${created.invoiceNumber}`,
          body: `Amount: ${formatBDT(amount)} · Due ${formatDateDisplay(values.dueDate)}`,
          link: `/invoices/${created.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save invoice.');
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
      await markInvoicePaid(invoice.id, values.paymentMethod, values.paymentReference);
      await invalidateInvoices();

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
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to mark invoice paid.');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!isAdmin) return;
    setActionError(null);
    setDeletingId(invoiceId);
    try {
      await deleteMutation.mutateAsync(invoiceId);
      setConfirmDeleteId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete invoice.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Project Invoices
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin
                ? `Manage billing, PDF invoices, and payment records for ${project.title}.`
                : `View statements, download PDF invoices, and submit payment details for ${project.title}.`}
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingInvoice(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>

        {actionError && (
          <div
            role="alert"
            className="mx-6 mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Dismiss error"
              className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center">
            <FileText
              className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No invoices for this project yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isAdmin
                ? 'Create an invoice to bill the client in BDT and generate a printable PDF.'
                : 'When Stack Dev issues an invoice for this project, it will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {invoices.map((invoice) => {
              const effectiveStatus = getEffectiveInvoiceStatus(invoice);
              const hasPendingReview =
                effectiveStatus !== 'Paid' && pendingInvoiceIds.has(invoice.id);
              const isConfirmingDelete = confirmDeleteId === invoice.id;
              const isDeleting = deletingId === invoice.id;

              return (
                <li
                  key={invoice.id}
                  className="p-5 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tabular-nums"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${STATUS_BADGE_CLASSES[effectiveStatus]}`}
                      >
                        {effectiveStatus}
                      </span>
                      {hasPendingReview && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60 whitespace-nowrap">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          Payment under review
                        </span>
                      )}
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatBDT(invoice.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      Issued {formatDateDisplay(invoice.issueDate)} · Due{' '}
                      {formatDateDisplay(invoice.dueDate)}
                      {effectiveStatus === 'Paid' && invoice.paymentMethod
                        ? ` · Paid via ${invoice.paymentMethod}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>View</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => downloadInvoicePdf(invoice)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>PDF</span>
                    </button>

                    {!isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
                      <Link
                        to={`/invoices/${invoice.id}#pay-now`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
                      >
                        <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{hasPendingReview ? 'Under Review' : 'Pay Now'}</span>
                      </Link>
                    )}

                    {isAdmin && effectiveStatus !== 'Paid' && (
                      <button
                        type="button"
                        onClick={() => setMarkingPaidInvoice(invoice)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Mark Paid</span>
                      </button>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingInvoice(invoice);
                            setIsModalOpen(true);
                          }}
                          aria-label={`Edit ${invoice.invoiceNumber}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>

                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteInvoice(invoice.id)}
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
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(invoice.id)}
                            aria-label={`Delete ${invoice.invoiceNumber}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
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
            clients={resolvedClients}
            projects={[project]}
            nextInvoiceNumber={nextInvoiceNumber}
            initialInvoice={editingInvoice}
            lockedClientId={project.clientId}
            lockedProjectId={project.id}
          />
          <MarkPaidModal
            invoice={markingPaidInvoice}
            onClose={() => setMarkingPaidInvoice(null)}
            onConfirm={handleConfirmMarkPaid}
          />
        </>
      )}
    </div>
  );
}
