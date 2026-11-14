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
          <div className="w-14 h-14 rounded-2xl bg-success-soft border border-success/25 flex items-center justify-center text-success-text">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Payment Successful
          </h1>
          <p className="text-sm text-muted max-w-md">
            Your payment has been verified and applied to your invoice.
          </p>
        </>
      )}

      {effectiveOutcome === 'pending' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600">
            <Clock className="w-7 h-7 animate-pulse" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Verifying Payment
          </h1>
          <p className="text-sm text-muted max-w-md">
            Your payment submission is pending review by Stack Dev. Your invoice status will update
            once confirmed.
          </p>
        </>
      )}

      {effectiveOutcome === 'fail' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-danger-soft border border-danger/25 flex items-center justify-center text-danger-text">
            <AlertCircle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {routeOutcome === 'success' ? 'Payment Not Verified' : 'Payment Failed'}
          </h1>
          <p className="text-sm text-muted max-w-md">{failDescription}</p>
        </>
      )}

      {effectiveOutcome === 'cancel' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-warning-soft border border-warning/25 flex items-center justify-center text-warning-text">
            <Ban className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Payment Cancelled
          </h1>
          <p className="text-sm text-muted max-w-md">
            You cancelled the payment session before completing checkout. You can retry whenever you
            are ready.
          </p>
        </>
      )}
    </div>
  );
}
