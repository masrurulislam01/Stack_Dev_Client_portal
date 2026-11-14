import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '@/lib/queryKeys';
import {
  list as listPaymentSubmissions,
  rejectSubmission,
  verifyAndMarkInvoicePaid,
  type ListPaymentSubmissionsOptions,
} from '@/services/payments';
import type {PaymentSubmissionRecord} from '@/types/portal';

export function usePaymentSubmissions(
  options: ListPaymentSubmissionsOptions = {},
  keyArg?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.payments.list(keyArg ?? options.invoiceId ?? options.status),
    queryFn: () => listPaymentSubmissions(options),
    enabled,
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (submission: PaymentSubmissionRecord) =>
      verifyAndMarkInvoicePaid(submission),
    onSuccess: (_updated, submission) => {
      void queryClient.invalidateQueries({queryKey: queryKeys.payments.prefix});
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
      void queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(submission.invoiceId),
      });
    },
  });
}

export function useRejectPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({submissionId, reason}: {submissionId: string; invoiceId: string; reason: string}) =>
      rejectSubmission(submissionId, reason),
    onSuccess: (_updated, variables) => {
      void queryClient.invalidateQueries({queryKey: queryKeys.payments.prefix});
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
      void queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(variables.invoiceId),
      });
    },
  });
}
