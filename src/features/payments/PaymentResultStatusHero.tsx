import {AlertCircle, Ban, CheckCircle2, Clock} from 'lucide-react';

export type PaymentResultOutcome = 'paid' | 'pending' | 'fail' | 'cancel';

interface PaymentResultStatusHeroProps {
  effectiveOutcome: PaymentResultOutcome;
  routeOutcome: 'success' | 'fail' | 'cancel';
  failDescription: string;
}

export function PaymentResultStatusHero({
  effectiveOutcome,
  routeOutcome,
  failDescription,
}: PaymentResultStatusHeroProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      {effectiveOutcome === 'paid' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Payment Successful
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Your payment has been verified and applied to your invoice.
          </p>
        </>
      )}

      {effectiveOutcome === 'pending' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Clock className="w-7 h-7 animate-pulse" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Verifying Payment
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Your payment submission is pending review by Stack Dev. Your invoice status will update
            once confirmed.
          </p>
        </>
      )}

      {effectiveOutcome === 'fail' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {routeOutcome === 'success' ? 'Payment Not Verified' : 'Payment Failed'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">{failDescription}</p>
        </>
      )}

      {effectiveOutcome === 'cancel' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Ban className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Payment Cancelled
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            You cancelled the payment session before completing checkout. You can retry whenever you
            are ready.
          </p>
        </>
      )}
    </div>
  );
}
