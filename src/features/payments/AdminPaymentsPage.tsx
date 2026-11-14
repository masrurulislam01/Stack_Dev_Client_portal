import {AlertCircle, Clock, Search} from 'lucide-react';
import {useMemo, useState} from 'react';
import {EmptyState} from '@/components/ui';
import {PaymentsVerificationMobileList} from '@/features/payments/PaymentsVerificationMobileList';
import {PaymentsVerificationTable} from '@/features/payments/PaymentsVerificationTable';
import {RejectPaymentModal} from '@/features/payments/RejectPaymentModal';
import {
  useAuth,
  usePaymentSubmissions,
  useRejectPaymentMutation,
  useToast,
  useVerifyPaymentMutation,
} from '@/hooks';
import {formatBDT} from '@/lib/constants';
import {getErrorMessage} from '@/services/serviceUtils';
import type {PaymentSubmissionRecord} from '@/types/portal';
import {createNotification} from '@/utils/notifications';

type FilterStatus = 'Pending' | 'Verified' | 'Rejected' | 'ALL';

export function AdminPaymentsPage() {
  const {user} = useAuth();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('Pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentSubmissionRecord | null>(null);

  const {data: submissions = [], isLoading: loading, error} = usePaymentSubmissions();
  const verifyMutation = useVerifyPaymentMutation();
  const rejectMutation = useRejectPaymentMutation();

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
      toast.success('Payment verified', `${submission.invoiceNumber} is now marked Paid (${submission.method}).`);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to verify payment submission.');
      console.error('[AdminPaymentsPage] Verify failed:', submission.id, err);
      toast.error('Verification failed', message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (submission: PaymentSubmissionRecord, reason: string) => {
    if (processingId || submission.status !== 'Pending') return;
    setProcessingId(submission.id);
    try {
      await rejectMutation.mutateAsync({submissionId: submission.id, invoiceId: submission.invoiceId, reason});
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
      toast.info('Payment rejected', `Client has been notified for ${submission.invoiceNumber}.`);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to reject payment submission.');
      console.error('[AdminPaymentsPage] Reject failed:', submission.id, err);
      toast.error('Rejection failed', message);
      throw err;
    } finally {
      setProcessingId(null);
    }
  };

  const filterTabs: {key: FilterStatus; label: string; count: number}[] = [
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
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{getErrorMessage(error, 'Unable to load payment submissions.')}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                statusFilter === tab.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search TrxID, client, invoice..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            className="border-0 shadow-none rounded-none p-12"
            icon={<Clock className="w-5 h-5" aria-hidden="true" />}
            title={statusFilter === 'Pending' ? 'No pending payments to verify' : 'No matching payment submissions'}
            description={
              statusFilter === 'Pending'
                ? 'When clients submit bKash, Nagad, or Bank transaction details, they will appear here.'
                : 'Try changing the status filter or search query.'
            }
          />
        ) : (
          <>
            <PaymentsVerificationTable
              submissions={filtered}
              processingId={processingId}
              onVerify={(sub) => void handleVerify(sub)}
              onReject={setRejectTarget}
            />
            <PaymentsVerificationMobileList
              submissions={filtered}
              processingId={processingId}
              onVerify={(sub) => void handleVerify(sub)}
              onReject={setRejectTarget}
            />
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
