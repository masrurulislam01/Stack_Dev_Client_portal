import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, XCircle} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Modal, Textarea} from '@/components/ui';
import {formatBDT} from '@/lib/constants';
import {
  rejectPaymentFormSchema,
  type PaymentSubmissionRecord,
  type RejectPaymentFormParsed,
  type RejectPaymentFormValues,
} from '@/types/portal';

const QUICK_REASONS = [
  'Transaction ID not found in bKash/Nagad statement',
  'Amount received does not match the submitted amount',
  'Sender phone number does not match our statement',
  'Duplicate or invalid Transaction ID',
];

interface RejectPaymentModalProps {
  submission: PaymentSubmissionRecord | null;
  onClose: () => void;
  onConfirmReject: (submission: PaymentSubmissionRecord, reason: string) => Promise<void>;
}

export function RejectPaymentModal({
  submission,
  onClose,
  onConfirmReject,
}: RejectPaymentModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<RejectPaymentFormValues, unknown, RejectPaymentFormParsed>({
    resolver: zodResolver(rejectPaymentFormSchema),
    defaultValues: {reason: ''},
  });

  useEffect(() => {
    if (submission) {
      setSubmitError(null);
      reset({reason: ''});
    }
  }, [submission, reset]);

  if (!submission) return null;

  const onSubmit = async (values: RejectPaymentFormParsed) => {
    setSubmitError(null);
    try {
      await onConfirmReject(submission, values.reason);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to reject payment submission.',
      );
    }
  };

  return (
    <Modal
      isOpen={Boolean(submission)}
      onClose={onClose}
      title="Reject Payment Submission"
      subtitle={`${submission.invoiceNumber || 'Invoice'} · ${submission.method} · ${formatBDT(submission.amountBdt)}`}
      size="sm"
      disableClose={isSubmitting}
      icon={
        <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
          <XCircle className="w-4 h-4" aria-hidden="true" />
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          The client will be notified of the rejection reason and can submit a corrected Transaction ID from their invoice page.
        </p>

        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 flex items-start gap-2 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Quick reasons
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setValue('reason', preset, {shouldValidate: true})}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          id="reject-reason-input"
          label="Rejection Reason"
          rows={3}
          placeholder="Explain why this payment could not be verified..."
          error={errors.reason?.message}
          {...register('reason')}
        />

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={isSubmitting}>
            {isSubmitting ? 'Rejecting...' : 'Reject & Notify Client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
