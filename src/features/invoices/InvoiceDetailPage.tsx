import {AlertCircle, ArrowLeft, CheckCircle2, X} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import {InvoiceDetailActionsBar} from '@/features/invoices/InvoiceDetailActionsBar';
import {InvoiceFormModal} from '@/features/invoices/InvoiceFormModal';
import {InvoicePaymentHistory} from '@/features/invoices/InvoicePaymentHistory';
import {InvoiceSheet} from '@/features/invoices/InvoiceSheet';
import {MarkPaidModal} from '@/features/invoices/MarkPaidModal';
import {PaymentReceiptSheet} from '@/features/invoices/PaymentReceiptSheet';
import {useInvoiceDetail} from '@/features/invoices/useInvoiceDetail';
import {PayNowPanel} from '@/features/payments/PayNowPanel';
import {RejectPaymentModal} from '@/features/payments/RejectPaymentModal';
import {getErrorMessage} from '@/services/serviceUtils';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

export function InvoiceDetailPage() {
  const {invoiceId} = useParams<{invoiceId: string}>();
  const detail = useInvoiceDetail(invoiceId);

  if (detail.loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-44 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-[540px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  if (!detail.invoice || detail.accessDenied) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Invoice unavailable
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {detail.invoiceError
            ? getErrorMessage(
                detail.invoiceError,
                'We could not find this invoice, or it has not been published to your account yet.',
              )
            : 'We could not find this invoice, or it has not been published to your account yet.'}
        </p>
        <Link
          to="/invoices"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  const {invoice} = detail;
  const effectiveStatus = getEffectiveInvoiceStatus(invoice);
  const pendingSubmissions = detail.paymentSubmissions.filter((s) => s.status === 'Pending');
  const hasPendingReview = effectiveStatus !== 'Paid' && pendingSubmissions.length > 0;
  const verifiedSubmission = detail.paymentSubmissions.find((s) => s.status === 'Verified');

  const scrollToPayNow = () => {
    document.getElementById('pay-now')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <InvoiceDetailActionsBar
        invoice={invoice}
        isAdmin={detail.isAdmin}
        effectiveStatus={effectiveStatus}
        hasPendingReview={hasPendingReview}
        onMarkPaid={() => detail.setIsMarkPaidOpen(true)}
        onEdit={() => detail.setIsEditOpen(true)}
        onScrollToPayNow={scrollToPayNow}
        onPrint={detail.handlePrint}
      />

      {detail.paymentSuccessMessage && (
        <div
          role="status"
          className="print:hidden flex items-start justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{detail.paymentSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => detail.setPaymentSuccessMessage(null)}
            aria-label="Dismiss payment confirmation"
            className="p-0.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {detail.paymentError && (
        <div
          role="alert"
          className="print:hidden flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{detail.paymentError}</span>
          </div>
          <button
            type="button"
            onClick={() => detail.setPaymentError(null)}
            aria-label="Dismiss payment error"
            className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <InvoiceSheet
        invoice={invoice}
        effectiveStatus={effectiveStatus}
        hasPendingReview={hasPendingReview}
        hiddenWhenPrintingReceipt={detail.printMode === 'receipt'}
      />

      {!detail.isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
        <PayNowPanel
          invoice={invoice}
          existingSubmissions={detail.paymentSubmissions}
          onSubmitProof={(values) => detail.handleSubmitPaymentProof(invoice, values)}
        />
      )}

      {effectiveStatus === 'Paid' && (
        <PaymentReceiptSheet
          invoice={invoice}
          verifiedSubmission={verifiedSubmission}
          visibleWhenPrinting={detail.printMode === 'receipt'}
          onPrintReceipt={() => detail.handlePrint('receipt')}
        />
      )}

      {(detail.paymentSubmissions.length > 0 || effectiveStatus === 'Paid') && (
        <InvoicePaymentHistory
          invoice={invoice}
          effectiveStatus={effectiveStatus}
          paymentSubmissions={detail.paymentSubmissions}
          isAdmin={detail.isAdmin}
          processingSubId={detail.processingSubId}
          onVerifySubmission={(sub) => void detail.handleVerifySubmission(sub)}
          onRequestReject={detail.setRejectTarget}
        />
      )}

      {detail.isAdmin && (
        <>
          <InvoiceFormModal
            isOpen={detail.isEditOpen}
            onClose={() => detail.setIsEditOpen(false)}
            onSave={detail.handleSaveEdit}
            clients={detail.clients}
            projects={detail.projects}
            nextInvoiceNumber={invoice.invoiceNumber}
            initialInvoice={invoice}
          />
          <MarkPaidModal
            invoice={detail.isMarkPaidOpen ? invoice : null}
            onClose={() => detail.setIsMarkPaidOpen(false)}
            onConfirm={detail.handleConfirmMarkPaid}
          />
          <RejectPaymentModal
            submission={detail.rejectTarget}
            onClose={() => detail.setRejectTarget(null)}
            onConfirmReject={detail.handleRejectSubmission}
          />
        </>
      )}
    </section>
  );
}
