import {AlertCircle, Send} from 'lucide-react';
import {Button, Input} from '@/components/ui';
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Step 2 · Submit Payment Reference
        </p>
      </div>

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
        <div>
          <span className="block text-[13px] font-semibold text-foreground mb-1.5">
            Payment Method
          </span>
          <div
            role="group"
            aria-label="Payment Method"
            className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-muted border border-border"
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
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                    active ? 'bg-surface text-foreground shadow-xs' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register('method')} />
          {errors.method && (
            <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.method.message}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="paynow-sender"
            type="text"
            label={
              selectedMethod === 'Bank'
                ? 'Sender Account / Name'
                : `Sender ${selectedMethod} Number`
            }
            placeholder={selectedMethod === 'Bank' ? 'Account or A/C title' : '017XXXXXXXX'}
            error={errors.senderNumber?.message}
            {...register('senderNumber')}
          />

          <Input
            id="paynow-amount"
            type="number"
            min={1}
            step="1"
            label="Amount Sent (BDT)"
            className="num"
            error={errors.amountBdt?.message}
            {...register('amountBdt')}
          />
        </div>

        <Input
          id="paynow-trx"
          type="text"
          label="Transaction ID (TrxID)"
          placeholder="e.g. 9G8H7J6K5L"
          className="font-mono"
          error={errors.transactionId?.message}
          {...register('transactionId')}
        />
      </fieldset>

      <div className="pt-1 flex justify-end">
        <Button
          type="submit"
          loading={isSubmitting}
          icon={<Send className="w-4 h-4" aria-hidden="true" />}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment Details'}
        </Button>
      </div>
    </form>
  );
}
