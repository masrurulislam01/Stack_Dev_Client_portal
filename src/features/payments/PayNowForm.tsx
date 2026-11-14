import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, Send} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Input} from '@/components/ui';
import {PAYMENT_SUBMISSION_METHODS} from '@/lib/constants';
import {
  paymentSubmissionFormSchema,
  type PaymentSubmissionFormParsed,
  type PaymentSubmissionFormValues,
  type PaymentSubmissionMethod,
  type PaymentSubmissionRecord,
} from '@/types/portal';

interface PayNowFormProps {
  invoiceId: string;
  invoiceAmount: number;
  existingSubmissions: PaymentSubmissionRecord[];
  selectedMethod: PaymentSubmissionMethod;
  onMethodChange: (method: PaymentSubmissionMethod) => void;
  onSubmitProof: (values: PaymentSubmissionFormParsed) => Promise<void>;
  onSubmitted: () => void;
}

export function PayNowForm({
  invoiceId,
  invoiceAmount,
  existingSubmissions,
  selectedMethod,
  onMethodChange,
  onSubmitProof,
  onSubmitted,
}: PayNowFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<PaymentSubmissionFormValues, unknown, PaymentSubmissionFormParsed>({
    resolver: zodResolver(paymentSubmissionFormSchema),
    defaultValues: {
      method: 'bKash',
      senderNumber: '',
      transactionId: '',
      amountBdt: invoiceAmount,
    },
  });

  const watchedMethod = watch('method') as PaymentSubmissionMethod;

  useEffect(() => {
    if (watchedMethod !== selectedMethod) {
      onMethodChange(watchedMethod);
    }
  }, [watchedMethod, selectedMethod, onMethodChange]);

  useEffect(() => {
    reset({
      method: 'bKash',
      senderNumber: '',
      transactionId: '',
      amountBdt: invoiceAmount,
    });
    setSubmitError(null);
  }, [invoiceId, invoiceAmount, reset]);

  const onSubmit = async (values: PaymentSubmissionFormParsed) => {
    setSubmitError(null);
    const normalizedTrx = values.transactionId.trim().toLowerCase();
    const alreadySubmitted = existingSubmissions.some(
      (sub) => sub.transactionId.trim().toLowerCase() === normalizedTrx,
    );
    if (alreadySubmitted) {
      setError('transactionId', {
        type: 'manual',
        message: 'This Transaction ID has already been submitted for this invoice.',
      });
      return;
    }

    try {
      await onSubmitProof(values);
      reset({
        method: values.method,
        senderNumber: '',
        transactionId: '',
        amountBdt: invoiceAmount,
      });
      onSubmitted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to submit payment details.';
      if (msg.toLowerCase().includes('transaction id')) {
        setError('transactionId', {type: 'manual', message: msg});
      } else {
        setSubmitError(msg);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 space-y-4" noValidate>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Step 2 · Submit Payment Reference
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

      <div>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Payment Method
        </span>
        <div
          role="group"
          aria-label="Payment Method"
          className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          {PAYMENT_SUBMISSION_METHODS.map((m) => {
            const active = selectedMethod === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setValue('method', m, {shouldValidate: true})}
                className={`min-h-[40px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('method')} />
        {errors.method && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.method.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="paynow-sender"
          label={
            selectedMethod === 'Bank' ? 'Sender Account / Name' : `Sender ${selectedMethod} Number`
          }
          placeholder={selectedMethod === 'Bank' ? 'Account or A/C title' : '017XXXXXXXX'}
          error={errors.senderNumber?.message}
          {...register('senderNumber')}
        />

        <Input
          id="paynow-amount"
          label="Amount Sent (BDT)"
          type="number"
          min={1}
          step="1"
          className="tabular-nums"
          error={errors.amountBdt?.message}
          {...register('amountBdt')}
        />
      </div>

      <Input
        id="paynow-trx"
        label="Transaction ID (TrxID)"
        placeholder="e.g. 9G8H7J6K5L"
        className="font-mono"
        error={errors.transactionId?.message}
        {...register('transactionId')}
      />

      <div className="pt-1 flex justify-end">
        <Button
          type="submit"
          loading={isSubmitting}
          leftIcon={<Send className="w-4 h-4" aria-hidden="true" />}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment Details'}
        </Button>
      </div>
    </form>
  );
}
