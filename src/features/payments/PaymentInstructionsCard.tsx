import {Check, Copy, ShieldCheck} from 'lucide-react';
import {PAYMENT_NUMBERS, type PaymentSubmissionMethod} from '@/config/constants';
import {useCopyToClipboard} from '@/hooks/useCopyToClipboard';

interface PaymentInstructionsCardProps {
  amountText: string;
  invoiceNumber: string;
  selectedMethod: PaymentSubmissionMethod;
}

export function PaymentInstructionsCard({
  amountText,
  invoiceNumber,
  selectedMethod,
}: PaymentInstructionsCardProps) {
  const {copiedKey, copy} = useCopyToClipboard(2000);

  return (
    <div className="lg:col-span-5 space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Step 1 · Send {amountText}
        </p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed tabular-nums">
          Send <span className="font-semibold text-slate-900 dark:text-slate-100">{amountText}</span>{' '}
          to one of the numbers below, then enter your sender number and Transaction ID.
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
                onClick={() => void copy(info.number, key)}
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
        <ShieldCheck
          className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <span>
          {PAYMENT_NUMBERS[selectedMethod].instructions} Reference:{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{invoiceNumber}</span>
          .
        </span>
      </div>
    </div>
  );
}
