import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, CreditCard, FileText} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import {Card, ErrorAlert, Skeleton} from '@/components/ui';
import {PAYMENT_FAILURE_REASON_MESSAGES} from '@/config/constants';
import {
  PaymentResultStatusHero,
  type PaymentResultOutcome,
} from '@/features/payments/PaymentResultStatusHero';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {getById as getInvoiceById} from '@/services/invoices';
import {getByTransactionId} from '@/services/payments';
import {getErrorMessage} from '@/services/serviceUtils';
import {formatBDT, formatDateTime} from '@/utils/format';

interface PaymentResultPageProps {
  outcome: 'success' | 'fail' | 'cancel';
}

export function PaymentResultPage({outcome}: PaymentResultPageProps) {
  const {user} = useAuth();
  const [searchParams] = useSearchParams();

  const tranId = searchParams.get('tran_id')?.trim() || '';
  const rawInvoiceIdParam = searchParams.get('invoice_id')?.trim() || '';
  const invoiceIdParam = /^[a-zA-Z0-9_-]{1,80}$/.test(rawInvoiceIdParam) ? rawInvoiceIdParam : '';
  const methodParam = searchParams.get('method')?.trim() || '';
  const reasonParam = searchParams.get('reason')?.trim() || '';

  const {
    data: payment = null,
    isLoading: loadingPayment,
    isFetching: fetchingPayment,
    error: paymentError,
    refetch: refetchPayment,
  } = useQuery({
    queryKey: queryKeys.payments.byTranId(tranId),
    queryFn: () => getByTransactionId(tranId),
    enabled: Boolean(user && tranId),
  });

  const resolvedInvoiceId = payment?.invoiceId || invoiceIdParam;

  const {
    data: invoice = null,
    isLoading: loadingInvoice,
    isFetching: fetchingInvoice,
    error: invoiceError,
    refetch: refetchInvoice,
  } = useQuery({
    queryKey: queryKeys.invoices.detail(resolvedInvoiceId),
    queryFn: () => getInvoiceById(resolvedInvoiceId),
    enabled: Boolean(user && resolvedInvoiceId),
  });

  const isInitialLoading =
    (Boolean(tranId) && loadingPayment && !payment) ||
    (Boolean(resolvedInvoiceId) && loadingInvoice && !invoice && !payment);
  const queryError = paymentError ?? invoiceError;
  const isRetrying = (fetchingPayment && !loadingPayment) || (fetchingInvoice && !loadingInvoice);

  const handleRetry = () => {
    if (paymentError && tranId) void refetchPayment();
    if (invoiceError && resolvedInvoiceId) void refetchInvoice();
  };

  const effectiveOutcome: PaymentResultOutcome = (() => {
    if (payment) {
      if (payment.status === 'Verified') return 'paid';
      if (payment.status === 'Rejected') return 'fail';
      if (outcome === 'cancel') return 'cancel';
      if (invoice?.status === 'Paid') return 'paid';
      return outcome === 'fail' ? 'fail' : 'pending';
    }
    if (invoice?.status === 'Paid' && outcome === 'success') return 'paid';
    if (outcome === 'success') return loadingPayment || loadingInvoice ? 'pending' : 'fail';
    return outcome;
  })();

  const isVerifiedPaid = effectiveOutcome === 'paid';
  const paymentMethod =
    payment?.method || invoice?.paymentMethod || (isVerifiedPaid ? methodParam : '') || '';
  const invoiceNumber = payment?.invoiceNumber || invoice?.invoiceNumber || '';
  const rawAmount = payment?.amountBdt ?? invoice?.amount ?? 0;
  const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
  const paidAt = invoice?.paidAt;
  const failDescription =
    PAYMENT_FAILURE_REASON_MESSAGES[reasonParam] ||
    (outcome === 'success'
      ? 'We could not confirm a verified payment record for this transaction yet. If you have submitted payment details, Stack Dev will verify shortly.'
      : 'Your payment could not be completed or verified. No charge was applied to your invoice.');

  const barClass = isInitialLoading
    ? 'bg-border'
    : effectiveOutcome === 'paid'
      ? 'bg-success'
      : effectiveOutcome === 'pending'
        ? 'bg-primary-600'
        : effectiveOutcome === 'cancel'
          ? 'bg-warning'
          : 'bg-danger';

  return (
    <section className="max-w-xl mx-auto py-4 sm:py-8 page-enter">
      <Card className="overflow-hidden">
        <div className={`h-2 ${barClass}`} />

        <div className="p-6 sm:p-8 space-y-6">
          {queryError && (
            <ErrorAlert
              message={getErrorMessage(queryError, 'Unable to load payment details.')}
              onRetry={handleRetry}
              retrying={isRetrying}
            />
          )}

          {isInitialLoading ? (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <Skeleton className="w-14 h-14 rounded-2xl mx-auto" />
                <Skeleton className="h-7 w-56 mx-auto" />
                <Skeleton className="h-4 w-72 max-w-full mx-auto" />
              </div>
              <div className="rounded-2xl bg-surface-muted/60 border border-border divide-y divide-border">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex items-center justify-between px-4 py-3 gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1">
                <Skeleton className="h-11 w-40 rounded-xl" />
                <Skeleton className="h-11 w-32 rounded-xl" />
              </div>
            </div>
          ) : (
            <>
              <PaymentResultStatusHero
                effectiveOutcome={effectiveOutcome}
                routeOutcome={outcome}
                failDescription={failDescription}
              />

              {(invoiceNumber ||
                amount > 0 ||
                paymentMethod ||
                tranId ||
                (Boolean(paidAt) && effectiveOutcome === 'paid')) && (
                <dl className="rounded-2xl bg-surface-muted/60 border border-border divide-y divide-border text-sm">
                  {invoiceNumber && (
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <dt className="text-muted">Invoice</dt>
                      <dd className="font-mono font-semibold text-foreground num">
                        {invoiceNumber}
                      </dd>
                    </div>
                  )}
                  {amount > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <dt className="text-muted">Amount</dt>
                      <dd className="font-heading font-bold text-foreground num">
                        {formatBDT(amount)}
                      </dd>
                    </div>
                  )}
                  {paymentMethod && (
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <dt className="text-muted">Payment Method</dt>
                      <dd className="font-medium text-foreground inline-flex items-center gap-1.5 text-right">
                        <CreditCard
                          className="w-4 h-4 text-primary-600 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{paymentMethod}</span>
                      </dd>
                    </div>
                  )}
                  {tranId && (
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <dt className="text-muted">Transaction ID</dt>
                      <dd className="font-mono text-xs text-body break-all text-right">
                        {tranId}
                      </dd>
                    </div>
                  )}
                  {Boolean(paidAt) && effectiveOutcome === 'paid' && (
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <dt className="text-muted">Paid At</dt>
                      <dd className="text-body num text-right">{formatDateTime(paidAt)}</dd>
                    </div>
                  )}
                </dl>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1">
                {resolvedInvoiceId && (
                  <Link
                    to={`/invoices/${resolvedInvoiceId}`}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:brightness-110 hover:shadow-brand transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {effectiveOutcome === 'paid' ? 'View Paid Invoice' : 'Return to Invoice'}
                    </span>
                  </Link>
                )}
                <Link
                  to="/invoices"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl border border-border-strong bg-surface text-foreground hover:bg-surface-muted text-sm font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <ArrowLeft className="w-4 h-4 text-muted" aria-hidden="true" />
                  <span>All Invoices</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </Card>
    </section>
  );
}
