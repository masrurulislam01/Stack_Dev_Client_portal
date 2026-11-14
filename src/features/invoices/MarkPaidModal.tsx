import {zodResolver} from '@hookform/resolvers/zod';
import {CheckCircle2, X} from 'lucide-react';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {PAYMENT_METHODS, type PaymentMethod} from '@/config/constants';
import {useEscapeKey} from '@/hooks/useEscapeKey';
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
    await onConfirm(invoice, values);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-paid-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="mark-paid-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Mark Invoice Paid
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {invoice.invoiceNumber} · {formatBDT(invoice.amount)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          <div>
            <label
              htmlFor="paid-method"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Payment Method
            </label>
            <select
              id="paid-method"
              {...register('paymentMethod')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.paymentMethod.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="paid-ref"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Reference Note (Optional)
            </label>
            <textarea
              id="paid-ref"
              rows={2}
              {...register('paymentReference')}
              placeholder="e.g. bKash TrxID 9G8H7J6K5L or Bank deposit ref..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
            />
            {errors.paymentReference && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.paymentReference.message}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
