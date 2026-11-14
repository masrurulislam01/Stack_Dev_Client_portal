import {useQueryClient} from '@tanstack/react-query';
import {AlertCircle, FileText, Plus, Search, X} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Button} from '@/components/ui';
import {InvoiceFormModal} from '@/features/invoices/InvoiceFormModal';
import {markPaidAndNotify, saveInvoiceAndNotify} from '@/features/invoices/invoiceHelpers';
import {InvoicesMobileList} from '@/features/invoices/InvoicesMobileList';
import {InvoicesSummaryCards} from '@/features/invoices/InvoicesSummaryCards';
import {InvoicesTable} from '@/features/invoices/InvoicesTable';
import {MarkPaidModal} from '@/features/invoices/MarkPaidModal';
import {
  useAuth,
  useClients,
  useDeleteInvoice,
  useInvoices,
  useLanguage,
  usePaymentSubmissions,
  useProjects,
} from '@/hooks';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  InvoiceFormParsed,
  InvoiceRecord,
  InvoiceStatus,
  MarkPaidFormParsed,
} from '@/types/portal';
import {generateNextInvoiceNumber, getEffectiveInvoiceStatus} from '@/utils/invoices';

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

  const canQueryInvoices = Boolean(user && (isAdmin || user.clientId));
  const {data: invoices = [], isLoading: loading, error: invoicesError} = useInvoices(
    {clientId: clientFilterId, includeDrafts: isAdmin},
    canQueryInvoices,
  );
  const {data: pendingPayments = []} = usePaymentSubmissions(
    {status: 'Pending'},
    'pending',
    canQueryInvoices,
  );
  const {data: clients = []} = useClients(isAdmin);
  const {data: rawProjects = []} = useProjects(undefined, isAdmin);
  const projects = useMemo(
    () => [...rawProjects].sort((a, b) => a.title.localeCompare(b.title)),
    [rawProjects],
  );
  const deleteMutation = useDeleteInvoice();

  const pendingInvoiceIds = useMemo(
    () => new Set(pendingPayments.map((p) => p.invoiceId)),
    [pendingPayments],
  );
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
      if (effective === 'Paid') paidAmount += inv.amount;
      else if (effective === 'Overdue') {
        unpaidAmount += inv.amount;
        overdueAmount += inv.amount;
        overdueCount += 1;
      } else if (effective === 'Sent') unpaidAmount += inv.amount;
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
    if (!isAdmin || !user) return;
    setPaymentError(null);
    try {
      await saveInvoiceAndNotify({
        values,
        editingInvoice,
        actor: {id: user.id, name: user.name},
        queryClient,
      });
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to save invoice.'));
      throw err;
    }
  };

  const handleConfirmMarkPaid = async (inv: InvoiceRecord, values: MarkPaidFormParsed) => {
    if (!isAdmin || !user) return;
    setPaymentError(null);
    try {
      await markPaidAndNotify({invoice: inv, values, actor: {id: user.id, name: user.name}, queryClient});
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
    paymentError || (invoicesError ? getErrorMessage(invoicesError, 'Unable to load invoices.') : null);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Invoices</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Create BDT invoices, record bKash/Nagad/Bank/Cash payments, and download PDF statements.'
              : 'Review your Stack Dev billing statements, due dates, and downloadable PDF invoices.'}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingInvoice(null);
              setIsModalOpen(true);
            }}
            disabled={clients.length === 0 || projects.length === 0}
            leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
            className="whitespace-nowrap shrink-0"
          >
            {t.actions.createInvoice}
          </Button>
        )}
      </div>

      {displayedError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{displayedError}</span>
          </div>
          {paymentError && (
            <button type="button" onClick={() => setPaymentError(null)} aria-label="Dismiss payment error" className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <InvoicesSummaryCards {...summary} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterStatuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, client, project..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {invoices.length === 0 ? 'No invoices found' : 'No matching invoices'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {invoices.length === 0
                ? isAdmin ? 'Create your first invoice to start billing clients in BDT.' : 'Published invoices from Stack Dev will appear here.'
                : 'Try adjusting your status filter or search query.'}
            </p>
          </div>
        ) : (
          <>
            <InvoicesTable
              invoices={filteredInvoices}
              isAdmin={isAdmin}
              pendingInvoiceIds={pendingInvoiceIds}
              confirmDeleteId={confirmDeleteId}
              deletingId={deletingId}
              downloadLabel={t.actions.downloadPdf}
              payLabel={t.actions.payOnline}
              markPaidLabel={t.actions.markPaid}
              onMarkPaid={setMarkingPaidInvoice}
              onEdit={(inv) => {
                setEditingInvoice(inv);
                setIsModalOpen(true);
              }}
              onRequestDelete={setConfirmDeleteId}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={(id) => void handleDeleteInvoice(id)}
            />
            <InvoicesMobileList
              invoices={filteredInvoices}
              isAdmin={isAdmin}
              pendingInvoiceIds={pendingInvoiceIds}
              viewLabel={t.actions.view}
              downloadLabel={t.actions.downloadPdf}
              payLabel={t.actions.payOnline}
              markPaidLabel={t.actions.markPaid}
              onMarkPaid={setMarkingPaidInvoice}
            />
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
          <MarkPaidModal invoice={markingPaidInvoice} onClose={() => setMarkingPaidInvoice(null)} onConfirm={handleConfirmMarkPaid} />
        </>
      )}
    </section>
  );
}
