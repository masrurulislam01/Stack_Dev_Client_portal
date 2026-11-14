import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, CheckCircle2, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Select, Textarea} from '@/components/ui';
import {PAYMENT_METHODS, type PaymentMethod} from '@/config/constants';
import {useEscapeKey} from '@/hooks/useEscapeKey';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  InvoiceRecord,
  MarkPaidFormParsed,
  MarkPaidFormValues,
} from '@/types/portal';
import {markPaidFormSchema} from '@/types/schemas';
import {formatBDT} from '@/utils/format';

interface MarkPaidModalProps {
  invoice: InvoiceRecord | null;
  onClose: () => void;
  onConfirm: (invoice: InvoiceRecord, values: MarkPaidFormParsed) => Promise<void>;
}

export function MarkPaidModal({invoice, onClose, onConfirm}: MarkPaidModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<MarkPaidFormValues, unknown, MarkPaidFormParsed>({
    resolver: zodResolver(markPaidFormSchema),
    defaultValues: {
      paymentMethod: 'bKash',
      paymentReference: '',
    },
  });

  useEffect(() => {
    if (invoice) {
      setSubmitError(null);
      const initialMethod: PaymentMethod = PAYMENT_METHODS.includes(
        invoice.paymentMethod as PaymentMethod,
      )
        ? (invoice.paymentMethod as PaymentMethod)
        : 'bKash';
      reset({
        paymentMethod: initialMethod,
        paymentReference: invoice.paymentReference || '',
      });
    }
  }, [invoice, reset]);

  useEscapeKey(Boolean(invoice) && !isSubmitting, onClose);
  if (!invoice) return null;

  const onSubmit = async (values: MarkPaidFormParsed) => {
    setSubmitError(null);
    try {
      await onConfirm(invoice, values);
      onClose();
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to mark invoice as paid. Please try again.'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-overlay backdrop-blur-[6px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-paid-title"
    >
      <div className="w-full max-w-md sm:my-auto bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-success-soft text-success-text flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="mark-paid-title"
                className="font-heading text-base font-semibold text-foreground truncate"
              >
                Mark Invoice Paid
              </h2>
              <p className="text-xs text-muted num truncate">
                <span className="font-mono">{invoice.invoiceNumber || 'Invoice'}</span> ·{' '}
                {formatBDT(Number.isFinite(invoice.amount) ? invoice.amount : 0)}
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
          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 flex items-start gap-2 text-xs font-medium text-danger-text"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-80">
            <Select
              id="paid-method"
              label="Payment Method"
              error={errors.paymentMethod?.message}
              {...register('paymentMethod')}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>

            <Textarea
              id="paid-ref"
              rows={2}
              label="Reference Note (Optional)"
              placeholder="e.g. bKash TrxID 9G8H7J6K5L or Bank deposit ref..."
              error={errors.paymentReference?.message}
              {...register('paymentReference')}
            />
          </fieldset>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
