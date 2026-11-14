import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, CreditCard, FileText} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import {PAYMENT_FAILURE_REASON_MESSAGES} from '@/config/constants';
import {
  PaymentResultStatusHero,
  type PaymentResultOutcome,
} from '@/features/payments/PaymentResultStatusHero';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {getById as getInvoiceById} from '@/services/invoices';
import {getByTransactionId} from '@/services/payments';
import {formatBDT, formatDateTime} from '@/utils/format';

interface PaymentResultPageProps {
  outcome: 'success' | 'fail' | 'cancel';
}

export function PaymentResultPage({outcome}: PaymentResultPageProps) {
  const {user} = useAuth();
  const [searchParams] = useSearchParams();

  const tranId = searchParams.get('tran_id')?.trim() || '';
  const invoiceIdParam = searchParams.get('invoice_id')?.trim() || '';
  const methodParam = searchParams.get('method')?.trim() || '';
  const reasonParam = searchParams.get('reason')?.trim() || '';

  const {data: payment = null, isLoading: loadingPayment} = useQuery({
    queryKey: queryKeys.payments.byTranId(tranId),
    queryFn: () => getByTransactionId(tranId),
    enabled: Boolean(user && tranId),
  });

  const resolvedInvoiceId = payment?.invoiceId || invoiceIdParam;

  const {data: invoice = null} = useQuery({
    queryKey: queryKeys.invoices.detail(resolvedInvoiceId),
    queryFn: () => getInvoiceById(resolvedInvoiceId),
    enabled: Boolean(user && resolvedInvoiceId),
  });

  const effectiveOutcome: PaymentResultOutcome = (() => {
    if (payment) {
      if (payment.status === 'Verified') return 'paid';
      if (payment.status === 'Rejected') return 'fail';
      if (outcome === 'cancel') return 'cancel';
      if (invoice?.status === 'Paid') return 'paid';
      return outcome === 'fail' ? 'fail' : 'pending';
    }
    if (invoice?.status === 'Paid' && outcome === 'success') return 'paid';
    if (outcome === 'success') return loadingPayment ? 'pending' : 'fail';
    return outcome;
  })();

  const isVerifiedPaid = effectiveOutcome === 'paid';
  const paymentMethod =
    payment?.method || invoice?.paymentMethod || (isVerifiedPaid ? methodParam : '') || '';
  const invoiceNumber = payment?.invoiceNumber || invoice?.invoiceNumber || '';
  const amount = payment?.amountBdt || invoice?.amount || 0;
  const paidAt = invoice?.paidAt;
  const failDescription =
    PAYMENT_FAILURE_REASON_MESSAGES[reasonParam] ||
    (outcome === 'success'
      ? 'We could not confirm a verified payment record for this transaction yet. If you have submitted payment details, Stack Dev will verify shortly.'
      : 'Your payment could not be completed or verified. No charge was applied to your invoice.');

  const barClass =
    effectiveOutcome === 'paid'
      ? 'bg-emerald-600'
      : effectiveOutcome === 'pending'
        ? 'bg-indigo-600'
        : effectiveOutcome === 'cancel'
          ? 'bg-amber-500'
          : 'bg-red-600';

  return (
    <section className="max-w-xl mx-auto py-4 sm:py-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className={`h-2 ${barClass}`} />

        <div className="p-6 sm:p-8 space-y-6">
          <PaymentResultStatusHero
            effectiveOutcome={effectiveOutcome}
            routeOutcome={outcome}
            failDescription={failDescription}
          />

          <dl className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {invoiceNumber && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Invoice</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {invoiceNumber}
                </dd>
              </div>
            )}
            {amount > 0 && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Amount</dt>
                <dd className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatBDT(amount)}
                </dd>
              </div>
            )}
            {paymentMethod && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Payment Method</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5 text-right">
                  <CreditCard
                    className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{paymentMethod}</span>
                </dd>
              </div>
            )}
            {tranId && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Transaction ID</dt>
                <dd className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all text-right">
                  {tranId}
                </dd>
              </div>
            )}
            {Boolean(paidAt) && effectiveOutcome === 'paid' && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Paid At</dt>
                <dd className="text-slate-700 dark:text-slate-300 tabular-nums text-right">
                  {formatDateTime(paidAt)}
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1">
            {resolvedInvoiceId && (
              <Link
                to={`/invoices/${resolvedInvoiceId}`}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                <span>
                  {effectiveOutcome === 'paid' ? 'View Paid Invoice' : 'Return to Invoice'}
                </span>
              </Link>
            )}
            <Link
              to="/invoices"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>All Invoices</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
