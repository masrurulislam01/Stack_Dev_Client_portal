import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  XCircle,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {RejectPaymentModal} from '../components/RejectPaymentModal';
import {useAuth} from '../context/AuthContext';
import {useToast} from '../context/ToastContext';
import {queryKeys} from '../lib/queryKeys';
import {
  list as listPaymentSubmissions,
  rejectSubmission,
  verifyAndMarkInvoicePaid,
} from '../services/payments';
import {getErrorMessage} from '../services/serviceUtils';
import type {PaymentSubmissionRecord, PaymentSubmissionStatus} from '../types/portal';
import {formatBDT, formatDateTime} from '../utils/format';
import {createNotification} from '../utils/notifications';

const SUBMISSION_STATUS_CLASSES: Record<PaymentSubmissionStatus, string> = {
  Pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Verified:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
  Rejected:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
};

export function AdminPaymentsPage() {
  const {user} = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Verified' | 'Rejected' | 'ALL'>('Pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentSubmissionRecord | null>(null);

  const {
    data: submissions = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.payments.list(),
    queryFn: () => listPaymentSubmissions(),
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({queryKey: queryKeys.payments.prefix}),
      queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix}),
    ]);
  };

  const verifyMutation = useMutation({
    mutationFn: (submission: PaymentSubmissionRecord) =>
      verifyAndMarkInvoicePaid(submission),
    onSuccess: () => invalidateAll(),
  });

  const rejectMutation = useMutation({
    mutationFn: ({id, reason}: {id: string; reason: string}) =>
      rejectSubmission(id, reason),
    onSuccess: () => invalidateAll(),
  });

  const counts = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;
    for (const s of submissions) {
      if (s.status === 'Pending') pending += 1;
      else if (s.status === 'Verified') verified += 1;
      else if (s.status === 'Rejected') rejected += 1;
    }
    return {pending, verified, rejected, total: submissions.length};
  }, [submissions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!term) return true;
      return (
        s.invoiceNumber.toLowerCase().includes(term) ||
        s.clientName.toLowerCase().includes(term) ||
        s.transactionId.toLowerCase().includes(term) ||
        s.senderNumber.toLowerCase().includes(term) ||
        s.method.toLowerCase().includes(term)
      );
    });
  }, [submissions, statusFilter, search]);

  const handleVerify = async (submission: PaymentSubmissionRecord) => {
    if (processingId || submission.status !== 'Pending') return;
    setProcessingId(submission.id);
    try {
      await verifyMutation.mutateAsync(submission);

      if (user && submission.clientId) {
        await createNotification({
          recipientRole: 'client',
          clientId: submission.clientId,
          projectId: submission.projectId,
          type: 'invoice',
          title: `Payment verified: ${submission.invoiceNumber}`,
          body: `${formatBDT(submission.amountBdt)} verified via ${submission.method} (TrxID: ${submission.transactionId}). Invoice marked Paid.`,
          link: `/invoices/${submission.invoiceId}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }

      toast.success(
        'Payment verified',
        `${submission.invoiceNumber} is now marked Paid (${submission.method}).`,
      );
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to verify payment submission.');
      console.error('[AdminPaymentsPage] Verify failed:', submission.id, err);
      toast.error('Verification failed', message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (
    submission: PaymentSubmissionRecord,
    reason: string,
  ) => {
    if (processingId || submission.status !== 'Pending') return;
    setProcessingId(submission.id);
    try {
      await rejectMutation.mutateAsync({id: submission.id, reason});

      if (user && submission.clientId) {
        await createNotification({
          recipientRole: 'client',
          clientId: submission.clientId,
          projectId: submission.projectId,
          type: 'invoice',
          title: `Payment submission rejected: ${submission.invoiceNumber}`,
          body: `Reason: ${reason}`,
          link: `/invoices/${submission.invoiceId}#pay-now`,
          actorUid: user.id,
          actorName: user.name,
        });
      }

      toast.info(
        'Payment rejected',
        `Client has been notified for ${submission.invoiceNumber}.`,
      );
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to reject payment submission.');
      console.error('[AdminPaymentsPage] Reject failed:', submission.id, err);
      toast.error('Rejection failed', message);
      throw err;
    } finally {
      setProcessingId(null);
    }
  };

  const filterTabs: {key: 'Pending' | 'Verified' | 'Rejected' | 'ALL'; label: string; count: number}[] = [
    {key: 'Pending', label: 'Pending', count: counts.pending},
    {key: 'Verified', label: 'Verified', count: counts.verified},
    {key: 'Rejected', label: 'Rejected', count: counts.rejected},
    {key: 'ALL', label: 'All', count: counts.total},
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Payments to Verify
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review client bKash, Nagad, and Bank transaction submissions before marking invoices Paid.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{getErrorMessage(error, 'Unable to load payment submissions.')}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
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
            placeholder="Search TrxID, client, invoice..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      {/* Submissions Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Clock
              className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {statusFilter === 'Pending'
                ? 'No pending payments to verify'
                : 'No matching payment submissions'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {statusFilter === 'Pending'
                ? 'When clients submit bKash, Nagad, or Bank transaction details, they will appear here.'
                : 'Try changing the status filter or search query.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-6">Invoice</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Sender Number</th>
                    <th className="py-3 px-4">TrxID</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {filtered.map((sub) => {
                    const isBusy = processingId === sub.id;
                    const invoiceAlreadyPaid = sub.invoiceStatus === 'Paid';
                    const canAct = sub.status === 'Pending' && !invoiceAlreadyPaid;

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <Link
                            to={`/invoices/${sub.invoiceId}`}
                            className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tabular-nums"
                          >
                            <span>{sub.invoiceNumber || 'Invoice'}</span>
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {formatDateTime(sub.createdAt)}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {sub.clientName}
                          </p>
                          {sub.projectTitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                              {sub.projectTitle}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {sub.method}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                          {sub.senderNumber}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                          {sub.transactionId}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                          {formatBDT(sub.amountBdt)}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SUBMISSION_STATUS_CLASSES[sub.status]}`}
                          >
                            {sub.status}
                          </span>
                          {sub.status === 'Rejected' && sub.rejectionReason && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400 max-w-[200px]">
                              {sub.rejectionReason}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          {canAct ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={Boolean(processingId)}
                                onClick={() => void handleVerify(sub)}
                                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{isBusy ? 'Verifying...' : 'Verify'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(processingId)}
                                onClick={() => setRejectTarget(sub)}
                                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-xs font-semibold transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : sub.status === 'Pending' && invoiceAlreadyPaid ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Invoice already Paid
                              </span>
                              <button
                                type="button"
                                disabled={Boolean(processingId)}
                                onClick={() => setRejectTarget(sub)}
                                className="inline-flex items-center gap-1 min-h-[32px] px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 text-xs font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <Link
                              to={`/invoices/${sub.invoiceId}`}
                              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              View Invoice
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards */}
            <ul className="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((sub) => {
                const isBusy = processingId === sub.id;
                const invoiceAlreadyPaid = sub.invoiceStatus === 'Paid';
                const canAct = sub.status === 'Pending' && !invoiceAlreadyPaid;

                return (
                  <li key={sub.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/invoices/${sub.invoiceId}`}
                          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline tabular-nums"
                        >
                          {sub.invoiceNumber || 'Invoice'}
                        </Link>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {sub.clientName}
                          {sub.projectTitle ? ` · ${sub.projectTitle}` : ''}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 ${SUBMISSION_STATUS_CLASSES[sub.status]}`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Method &amp; Amount</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {sub.method} · {formatBDT(sub.amountBdt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Sender</dt>
                        <dd className="font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                          {sub.senderNumber}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Transaction ID</dt>
                        <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {sub.transactionId}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">Submitted</dt>
                        <dd className="text-slate-600 dark:text-slate-300 tabular-nums">
                          {formatDateTime(sub.createdAt)}
                        </dd>
                      </div>
                    </dl>

                    {sub.status === 'Rejected' && sub.rejectionReason && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Reason: {sub.rejectionReason}
                      </p>
                    )}

                    {canAct && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={Boolean(processingId)}
                          onClick={() => void handleVerify(sub)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{isBusy ? 'Verifying...' : 'Verify'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(processingId)}
                          onClick={() => setRejectTarget(sub)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-xs font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <RejectPaymentModal
        submission={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirmReject={handleConfirmReject}
      />
    </section>
  );
}
