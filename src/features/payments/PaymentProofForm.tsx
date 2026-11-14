import {AlertCircle, Send} from 'lucide-react';
import {PAYMENT_SUBMISSION_METHODS, type PaymentSubmissionMethod} from '@/config/constants';
import {usePaymentProofForm} from '@/features/payments/usePaymentProofForm';
import type {
  PaymentSubmissionFormParsed,
  PaymentSubmissionRecord,
} from '@/types/portal';

interface PaymentProofFormProps {
  invoiceId: string;
  invoiceAmount: number;
  existingSubmissions: PaymentSubmissionRecord[];
  selectedMethod: PaymentSubmissionMethod;
  onMethodChange: (method: PaymentSubmissionMethod) => void;
  onSubmitProof: (values: PaymentSubmissionFormParsed) => Promise<void>;
  onSuccessReset: () => void;
}

export function PaymentProofForm({
  invoiceId,
  invoiceAmount,
  existingSubmissions,
  selectedMethod,
  onMethodChange,
  onSubmitProof,
  onSuccessReset,
}: PaymentProofFormProps) {
  const {register, setValue, errors, isSubmitting, submitError, handleFormSubmit} =
    usePaymentProofForm({
      invoiceId,
      invoiceAmount,
      existingSubmissions,
      onMethodChange,
      onSubmitProof,
      onSuccessReset,
    });

  return (
    <form onSubmit={handleFormSubmit} className="lg:col-span-7 space-y-4" noValidate>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Step 2 · Submit Payment Reference
        </p>
      </div>

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
                onClick={() => {
                  onMethodChange(m);
                  setValue('method', m, {shouldValidate: true});
                }}
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
        <div>
          <label
            htmlFor="paynow-sender"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {selectedMethod === 'Bank'
              ? 'Sender Account / Name'
              : `Sender ${selectedMethod} Number`}
          </label>
          <input
            id="paynow-sender"
            type="text"
            {...register('senderNumber')}
            placeholder={selectedMethod === 'Bank' ? 'Account or A/C title' : '017XXXXXXXX'}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
          {errors.senderNumber && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.senderNumber.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="paynow-amount"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Amount Sent (BDT)
          </label>
          <input
            id="paynow-amount"
            type="number"
            min={1}
            step="1"
            {...register('amountBdt')}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
          {errors.amountBdt && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.amountBdt.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="paynow-trx"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          Transaction ID (TrxID)
        </label>
        <input
          id="paynow-trx"
          type="text"
          {...register('transactionId')}
          placeholder="e.g. 9G8H7J6K5L"
          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
        />
        {errors.transactionId && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.transactionId.message}
          </p>
        )}
      </div>

      <div className="pt-1 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>{isSubmitting ? 'Submitting...' : 'Submit Payment Details'}</span>
        </button>
      </div>
    </form>
  );
}
