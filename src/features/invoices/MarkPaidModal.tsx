import {zodResolver} from '@hookform/resolvers/zod';
import {CheckCircle2} from 'lucide-react';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Modal, Select, Textarea} from '@/components/ui';
import {formatBDT, PAYMENT_METHODS} from '@/lib/constants';
import {
  markPaidFormSchema,
  type InvoiceRecord,
  type MarkPaidFormParsed,
  type MarkPaidFormValues,
  type PaymentMethod,
} from '@/types/portal';

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

  if (!invoice) return null;

  const onSubmit = async (values: MarkPaidFormParsed) => {
    await onConfirm(invoice, values);
    onClose();
  };

  return (
    <Modal
      isOpen={Boolean(invoice)}
      onClose={onClose}
      title="Mark Invoice Paid"
      subtitle={`${invoice.invoiceNumber} · ${formatBDT(invoice.amount)}`}
      size="sm"
      disableClose={isSubmitting}
      icon={
        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
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
          label="Reference Note (Optional)"
          rows={2}
          placeholder="e.g. bKash TrxID 9G8H7J6K5L or Bank deposit ref..."
          error={errors.paymentReference?.message}
          {...register('paymentReference')}
        />

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600"
          >
            {isSubmitting ? 'Saving...' : 'Confirm Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
