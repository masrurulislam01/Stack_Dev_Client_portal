import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, X, XCircle} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-payment-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="reject-payment-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Reject Payment Submission
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {submission.invoiceNumber || 'Invoice'} · {submission.method} ·{' '}
                {formatBDT(submission.amountBdt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

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
              {PAYMENT_REJECT_QUICK_REASONS.map((preset) => (
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

          <div>
            <label
              htmlFor="reject-reason-input"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Rejection Reason
            </label>
            <textarea
              id="reject-reason-input"
              rows={3}
              {...register('reason')}
              placeholder="Explain why this payment could not be verified..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.reason.message}</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject & Notify Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
