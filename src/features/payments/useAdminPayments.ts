import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useMemo, useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {useToast} from '@/hooks/useToast';
import {queryKeys} from '@/lib/queryKeys';
import {
  list as listPaymentSubmissions,
  rejectSubmission,
  verifyAndMarkInvoicePaid,
} from '@/services/payments';
import {getErrorMessage} from '@/services/serviceUtils';
import type {PaymentSubmissionRecord} from '@/types/portal';
import {formatBDT} from '@/utils/format';
import {createNotification} from '@/utils/notifications';

export type PaymentStatusFilter = 'Pending' | 'Verified' | 'Rejected' | 'ALL';

export function useAdminPayments() {
  const {user} = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('Pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentSubmissionRecord | null>(null);

  const {
    data: submissions = [],
    isLoading: loading,
    isFetching,
    error,
    refetch,
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

  type PaymentSnapshot = Array<[readonly unknown[], PaymentSubmissionRecord[] | undefined]>;

  const verifyMutation = useMutation({
    mutationFn: (submission: PaymentSubmissionRecord) => verifyAndMarkInvoicePaid(submission),
    onMutate: async (submission) => {
      await queryClient.cancelQueries({queryKey: queryKeys.payments.prefix});
      const previous = queryClient.getQueriesData<PaymentSubmissionRecord[]>({
        queryKey: queryKeys.payments.prefix,
      });
      queryClient.setQueriesData<PaymentSubmissionRecord[]>(
        {queryKey: queryKeys.payments.prefix},
        (old) =>
          old?.map((item) =>
            item.id === submission.id
              ? {
                  ...item,
                  status: 'Verified',
                  invoiceStatus: 'Paid',
                  verifiedAt: new Date().toISOString(),
                }
              : item,
          ),
      );
      return {previous};
    },
    onError: (_err, _submission, context?: {previous: PaymentSnapshot}) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => invalidateAll(),
  });

  const rejectMutation = useMutation({
    mutationFn: ({id, reason}: {id: string; reason: string}) => rejectSubmission(id, reason),
    onMutate: async ({id, reason}) => {
      await queryClient.cancelQueries({queryKey: queryKeys.payments.prefix});
      const previous = queryClient.getQueriesData<PaymentSubmissionRecord[]>({
        queryKey: queryKeys.payments.prefix,
      });
      queryClient.setQueriesData<PaymentSubmissionRecord[]>(
        {queryKey: queryKeys.payments.prefix},
        (old) =>
          old?.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'Rejected',
                  rejectionReason: reason,
                }
              : item,
          ),
      );
      return {previous};
    },
    onError: (_err, _vars, context?: {previous: PaymentSnapshot}) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => invalidateAll(),
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
        (s.invoiceNumber ?? '').toLowerCase().includes(term) ||
        (s.clientName ?? '').toLowerCase().includes(term) ||
        (s.transactionId ?? '').toLowerCase().includes(term) ||
        (s.senderNumber ?? '').toLowerCase().includes(term) ||
        (s.method ?? '').toLowerCase().includes(term)
      );
    });
  }, [submissions, statusFilter, search]);

  const handleVerify = async (submission: PaymentSubmissionRecord) => {
    if (processingId || submission.status !== 'Pending') return;
    setProcessingId(submission.id);
    const invoiceLabel = submission.invoiceNumber || 'Invoice';
    const amountSafe = Number.isFinite(submission.amountBdt) ? submission.amountBdt : 0;
    try {
      await verifyMutation.mutateAsync(submission);
      if (user && submission.clientId) {
        await createNotification({
          recipientRole: 'client',
          clientId: submission.clientId,
          projectId: submission.projectId,
          type: 'invoice',
          title: `Payment verified: ${invoiceLabel}`,
          body: `${formatBDT(amountSafe)} verified via ${submission.method || 'Payment'} (TrxID: ${submission.transactionId || '—'}). Invoice marked Paid.`,
          link: `/invoices/${submission.invoiceId}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
      toast.success(
        'Payment verified',
        `${invoiceLabel} is now marked Paid (${submission.method || 'Payment'}).`,
      );
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
    const invoiceLabel = submission.invoiceNumber || 'Invoice';
    try {
      await rejectMutation.mutateAsync({id: submission.id, reason});
      if (user && submission.clientId) {
        await createNotification({
          recipientRole: 'client',
          clientId: submission.clientId,
          projectId: submission.projectId,
          type: 'invoice',
          title: `Payment submission rejected: ${invoiceLabel}`,
          body: `Reason: ${reason}`,
          link: `/invoices/${submission.invoiceId}#pay-now`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
      toast.info('Payment rejected', `Client has been notified for ${invoiceLabel}.`);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to reject payment submission.');
      console.error('[AdminPaymentsPage] Reject failed:', submission.id, err);
      toast.error('Rejection failed', message);
      throw err;
    } finally {
      setProcessingId(null);
    }
  };

  const filterTabs: {key: PaymentStatusFilter; label: string; count: number}[] = [
    {key: 'Pending', label: 'Pending', count: counts.pending},
    {key: 'Verified', label: 'Verified', count: counts.verified},
    {key: 'Rejected', label: 'Rejected', count: counts.rejected},
    {key: 'ALL', label: 'All', count: counts.total},
  ];

  return {
    loading,
    retrying: isFetching && !loading,
    error,
    refetch,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    processingId,
    rejectTarget,
    setRejectTarget,
    filtered,
    filterTabs,
    handleVerify,
    handleConfirmReject,
  };
}
