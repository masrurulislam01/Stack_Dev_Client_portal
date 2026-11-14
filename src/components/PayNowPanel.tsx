import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, Check, Clock, Copy, Send, ShieldCheck} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {PAYMENT_NUMBERS} from '../constants/payments';
import {
  PAYMENT_SUBMISSION_METHODS,
  paymentSubmissionFormSchema,
  type InvoiceRecord,
  type PaymentSubmissionFormParsed,
  type PaymentSubmissionFormValues,
  type PaymentSubmissionMethod,
  type PaymentSubmissionRecord,
} from '../types/portal';
import {formatBDT, formatDateTime} from '../utils/format';

interface PayNowPanelProps {
  invoice: InvoiceRecord;
  existingSubmissions: PaymentSubmissionRecord[];
  onSubmitProof: (values: PaymentSubmissionFormParsed) => Promise<void>;
}

export function PayNowPanel({
  invoice,
  existingSubmissions,
  onSubmitProof,
}: PayNowPanelProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showExtraForm, setShowExtraForm] = useState(false);

  const pendingSubmissions = existingSubmissions.filter((s) => s.status === 'Pending');
  const latestRejected = existingSubmissions.find((s) => s.status === 'Rejected');
  const isUnderReview = pendingSubmissions.length > 0;

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
      amountBdt: invoice.amount,
    },
  });

  const selectedMethod = watch('method') as PaymentSubmissionMethod;

  useEffect(() => {
    reset({
      method: 'bKash',
      senderNumber: '',
      transactionId: '',
      amountBdt: invoice.amount,
    });
    setSubmitError(null);
  }, [invoice.id, invoice.amount, reset]);

  const handleCopyNumber = async (channelKey: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(channelKey);
      setTimeout(() => setCopiedKey((prev) => (prev === channelKey ? null : prev)), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

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
        amountBdt: invoice.amount,
      });
      setShowExtraForm(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to submit payment details.';
      if (msg.toLowerCase().includes('transaction id')) {
        setError('transactionId', {type: 'manual', message: msg});
      } else {
        setSubmitError(msg);
      }
    }
  };

  const showForm = !isUnderReview || showExtraForm;
  const amountText = formatBDT(invoice.amount);

  return (
    <section
      id="pay-now"
      aria-labelledby="pay-now-heading"
      className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3
            id="pay-now-heading"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Pay Now
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Send {amountText} to Stack Dev via bKash, Nagad, or Bank transfer, then submit your Transaction ID for verification.
          </p>
        </div>

        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 tabular-nums whitespace-nowrap">
          Due: {amountText}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Payment Under Review Banner */}
        {isUnderReview && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <Clock
                  className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Payment under review
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    We have received your payment details and notified Stack Dev. Your invoice status will update to Paid once verified.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExtraForm((prev) => !prev)}
                className="inline-flex items-center justify-center min-h-[36px] px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 transition-colors whitespace-nowrap shrink-0"
              >
                {showExtraForm ? 'Hide payment form' : 'Submit another TrxID'}
              </button>
            </div>

            <ul className="divide-y divide-amber-200/70 dark:divide-amber-900/40 border-t border-amber-200/70 dark:border-amber-900/40 pt-2">
              {pendingSubmissions.map((sub) => (
                <li
                  key={sub.id}
                  className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200"
                >
                  <span className="font-medium tabular-nums">
                    {sub.method} · {formatBDT(sub.amountBdt)} · TrxID:{' '}
                    <span className="font-mono">{sub.transactionId}</span> · From {sub.senderNumber}
                  </span>
                  <span className="text-amber-700 dark:text-amber-300 tabular-nums">
                    Submitted {formatDateTime(sub.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Previous Rejection Notice (if latest attempt was rejected and no pending submission) */}
        {!isUnderReview && latestRejected && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                Previous submission ({latestRejected.method} · TrxID: {latestRejected.transactionId}) was rejected
              </p>
              {latestRejected.rejectionReason && (
                <p className="mt-0.5">Reason: {latestRejected.rejectionReason}</p>
              )}
            </div>
          </div>
        )}

        {showForm && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Step 1: Payment Numbers & Instructions */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Step 1 · Send {amountText}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed tabular-nums">
                  Send <span className="font-semibold text-slate-900 dark:text-slate-100">{amountText}</span> to one of the numbers below, then enter your sender number and Transaction ID.
                </p>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
                {(['bKash', 'Nagad'] as const).map((key) => {
                  const info = PAYMENT_NUMBERS[key];
                  const isSelected = selectedMethod === key;
                  const copied = copiedKey === key;
                  return (
                    <div
                      key={key}
                      className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {info.label}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{info.accountType}</span>
                        </div>
                        <p className="mt-1 font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-400 tabular-nums">
                          {info.number}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleCopyNumber(key, info.number)}
                        aria-label={`Copy ${info.label} number`}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}

                <div
                  className={`p-4 ${
                    selectedMethod === 'Bank' ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {PAYMENT_NUMBERS.Bank.label}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{PAYMENT_NUMBERS.Bank.accountType}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {PAYMENT_NUMBERS.Bank.number}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {PAYMENT_NUMBERS[selectedMethod].instructions} Reference:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {invoice.invoiceNumber}
                  </span>
                  .
                </span>
              </div>
            </div>

            {/* Step 2: Submission Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="lg:col-span-7 space-y-4"
              noValidate
            >
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
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.method.message}
                  </p>
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
          </div>
        )}
      </div>
    </section>
  );
}
