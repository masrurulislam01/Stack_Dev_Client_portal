import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, X, XCircle} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Textarea} from '@/components/ui';
import {PAYMENT_REJECT_QUICK_REASONS} from '@/config/constants';
import {useEscapeKey} from '@/hooks/useEscapeKey';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  PaymentSubmissionRecord,
  RejectPaymentFormParsed,
  RejectPaymentFormValues,
} from '@/types/portal';
import {rejectPaymentFormSchema} from '@/types/schemas';
import {formatBDT} from '@/utils/format';

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

  useEscapeKey(Boolean(submission) && !isSubmitting, onClose);

  if (!submission) return null;

  const onSubmit = async (values: RejectPaymentFormParsed) => {
    setSubmitError(null);
    try {
      await onConfirmReject(submission, values.reason);
      onClose();
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to reject payment submission.'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-overlay backdrop-blur-[6px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-payment-title"
    >
      <div className="w-full max-w-md sm:my-auto bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-danger-soft text-danger-text flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="reject-payment-title"
                className="font-heading text-base font-semibold text-foreground truncate"
              >
                Reject Payment Submission
              </h2>
              <p className="text-xs text-muted num truncate">
                <span className="font-mono">{submission.invoiceNumber || 'Invoice'}</span> ·{' '}
                {submission.method || 'Payment'} ·{' '}
                {formatBDT(Number.isFinite(submission.amountBdt) ? submission.amountBdt : 0)}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-muted hover:text-foreground hover:bg-surface-muted disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          <p className="text-xs text-muted leading-relaxed">
            The client will be notified of the rejection reason and can submit a corrected Transaction ID from their invoice page.
          </p>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 flex items-start gap-2 text-xs font-medium text-danger-text"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-70">
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Quick reasons
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_REJECT_QUICK_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setValue('reason', preset, {shouldValidate: true})}
                    className="px-2.5 py-1.5 rounded-xl border border-border bg-surface-muted text-xs font-medium text-body hover:border-border-strong hover:text-foreground text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              id="reject-reason-input"
              rows={3}
              label="Rejection Reason"
              placeholder="Explain why this payment could not be verified..."
              error={errors.reason?.message}
              {...register('reason')}
            />
          </fieldset>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={isSubmitting}>
              {isSubmitting ? 'Rejecting...' : 'Reject & Notify Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
