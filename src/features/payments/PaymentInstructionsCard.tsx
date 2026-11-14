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
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted num">
          Step 1 · Send {amountText}
        </p>
        <p className="mt-1.5 text-sm text-body leading-relaxed num">
          Send <span className="font-semibold text-foreground">{amountText}</span> to one of the
          numbers below, then enter your sender number and Transaction ID.
        </p>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border bg-surface-muted/60 overflow-hidden">
        {(['bKash', 'Nagad'] as const).map((key) => {
          const info = PAYMENT_NUMBERS[key];
          const isSelected = selectedMethod === key;
          const copied = copiedKey === key;
          return (
            <div
              key={key}
              className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                isSelected ? 'bg-primary-50/70 border-l-2 border-l-primary-600' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="font-semibold text-foreground text-sm">{info.label}</span>
                  <span aria-hidden="true">·</span>
                  <span>{info.accountType}</span>
                </div>
                <p className="mt-1 font-mono text-sm font-semibold text-primary-600 num">
                  {info.number}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void copy(info.number, key)}
                aria-label={`Copy ${info.label} number`}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-border-strong bg-surface text-xs font-semibold text-foreground hover:bg-surface-muted shadow-xs transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success-text" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          );
        })}

        <div
          className={`p-4 transition-colors ${
            selectedMethod === 'Bank' ? 'bg-primary-50/70 border-l-2 border-l-primary-600' : ''
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-foreground text-sm">
              {PAYMENT_NUMBERS.Bank.label}
            </span>
            <span aria-hidden="true">·</span>
            <span>{PAYMENT_NUMBERS.Bank.accountType}</span>
          </div>
          <p className="mt-1 text-xs text-body">{PAYMENT_NUMBERS.Bank.number}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted">
        <ShieldCheck className="w-4 h-4 text-success-text shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          {PAYMENT_NUMBERS[selectedMethod].instructions} Reference:{' '}
          <span className="font-mono font-semibold text-foreground">{invoiceNumber}</span>.
        </span>
      </div>
    </div>
  );
}
