import {useQuery} from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
} from 'lucide-react';
import {Link, useSearchParams} from 'react-router-dom';
import {useAuth, useInvoiceDetail} from '@/hooks';
import {formatBDT} from '@/lib/constants';
import {queryKeys} from '@/lib/queryKeys';
import {getByTransactionId} from '@/services/payments';
import {formatDateTime} from '@/utils/format';

const REASON_MESSAGES: Record<string, string> = {
  validation_failed: 'The payment could not be verified yet. No charge was applied to your invoice.',
  verification_error: 'An error occurred while confirming this transaction. Please check your invoice status or try again.',
  gateway_failed: 'The payment was declined or could not be completed.',
  invalid_parameters: 'Missing or invalid payment verification parameters.',
  payment_not_found: 'No matching payment record was found for this transaction ID.',
  tran_id_mismatch: 'Transaction ID did not match the submitted payment record.',
  currency_mismatch: 'Currency did not match BDT. Payment was rejected.',
  amount_mismatch: 'Payment amount did not match the invoice total.',
};

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
  const {data: invoice = null} = useInvoiceDetail(resolvedInvoiceId, Boolean(user && resolvedInvoiceId));

  const effectiveOutcome: 'paid' | 'pending' | 'fail' | 'cancel' = (() => {
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
  const paymentMethod = payment?.method || invoice?.paymentMethod || (isVerifiedPaid ? methodParam : '') || '';
  const invoiceNumber = payment?.invoiceNumber || invoice?.invoiceNumber || '';
  const amount = payment?.amountBdt || invoice?.amount || 0;
  const paidAt = invoice?.paidAt;
  const failDescription =
    REASON_MESSAGES[reasonParam] ||
    (outcome === 'success'
      ? 'We could not confirm a verified payment record for this transaction yet. If you have submitted payment details, Stack Dev will verify shortly.'
      : 'Your payment could not be completed or verified. No charge was applied to your invoice.');

  return (
    <section className="max-w-xl mx-auto py-4 sm:py-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div
          className={`h-2 ${
            effectiveOutcome === 'paid'
              ? 'bg-emerald-600'
              : effectiveOutcome === 'pending'
                ? 'bg-indigo-600'
                : effectiveOutcome === 'cancel'
                  ? 'bg-amber-500'
                  : 'bg-red-600'
          }`}
        />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            {effectiveOutcome === 'paid' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Payment Successful</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">Your payment has been verified and applied to your invoice.</p>
              </>
            )}
            {effectiveOutcome === 'pending' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-7 h-7 animate-pulse" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Verifying Payment</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">Your payment submission is pending review by Stack Dev. Your invoice status will update once confirmed.</p>
              </>
            )}
            {effectiveOutcome === 'fail' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertCircle className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {outcome === 'success' ? 'Payment Not Verified' : 'Payment Failed'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">{failDescription}</p>
              </>
            )}
            {effectiveOutcome === 'cancel' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Ban className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Payment Cancelled</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">You cancelled the payment session before completing checkout. You can retry whenever you are ready.</p>
              </>
            )}
          </div>

          <dl className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {invoiceNumber && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Invoice</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{invoiceNumber}</dd>
              </div>
            )}
            {amount > 0 && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Amount</dt>
                <dd className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatBDT(amount)}</dd>
              </div>
            )}
            {paymentMethod && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Payment Method</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5 text-right">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
                  <span>{paymentMethod}</span>
                </dd>
              </div>
            )}
            {tranId && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Transaction ID</dt>
                <dd className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all text-right">{tranId}</dd>
              </div>
            )}
            {Boolean(paidAt) && effectiveOutcome === 'paid' && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Paid At</dt>
                <dd className="text-slate-700 dark:text-slate-300 tabular-nums text-right">{formatDateTime(paidAt)}</dd>
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
                <span>{effectiveOutcome === 'paid' ? 'View Paid Invoice' : 'Return to Invoice'}</span>
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
