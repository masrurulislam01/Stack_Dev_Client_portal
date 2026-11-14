import {ArrowLeft, CheckCircle2, RefreshCw, X} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import {Button, Card, ErrorAlert} from '@/components/ui';
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 rounded-xl skeleton-shimmer" />
            <div className="h-10 w-24 rounded-xl skeleton-shimmer" />
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="h-2 skeleton-shimmer" />
          <div className="p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-border">
              <div className="space-y-2">
                <div className="h-7 w-40 rounded skeleton-shimmer" />
                <div className="h-4 w-56 rounded skeleton-shimmer" />
                <div className="h-4 w-36 rounded skeleton-shimmer" />
              </div>
              <div className="space-y-2 sm:text-right">
                <div className="h-4 w-16 rounded skeleton-shimmer sm:ml-auto" />
                <div className="h-6 w-28 rounded skeleton-shimmer sm:ml-auto" />
                <div className="h-5 w-20 rounded-full skeleton-shimmer sm:ml-auto" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-3.5 w-16 rounded skeleton-shimmer" />
                <div className="h-5 w-44 rounded skeleton-shimmer" />
                <div className="h-4 w-52 rounded skeleton-shimmer" />
              </div>
              <div className="space-y-2 sm:text-right">
                <div className="h-4 w-40 rounded skeleton-shimmer sm:ml-auto" />
                <div className="h-4 w-40 rounded skeleton-shimmer sm:ml-auto" />
              </div>
            </div>
            <div className="h-36 rounded-xl skeleton-shimmer" />
            <div className="flex justify-end">
              <div className="h-14 w-full sm:w-72 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!detail.invoice || detail.accessDenied) {
    return (
      <Card className="max-w-xl mx-auto p-10 sm:p-12 text-center space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Invoice unavailable</h2>
        <p className="text-sm text-muted">
          {detail.invoiceError
            ? getErrorMessage(
                detail.invoiceError,
                'We could not find this invoice, or it has not been published to your account yet.',
              )
            : 'We could not find this invoice, or it has not been published to your account yet.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {detail.invoiceError && (
            <Button
              variant="secondary"
              onClick={() => void detail.refetchInvoice()}
              loading={detail.isRetryingInvoice}
              icon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
            >
              Retry
            </Button>
          )}
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:brightness-110 transition-all"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Invoices</span>
          </Link>
        </div>
      </Card>
    );
  }

  const {invoice} = detail;
  const effectiveStatus = getEffectiveInvoiceStatus(invoice);
  const amount = Number.isFinite(invoice.amount) ? invoice.amount : 0;
  const pendingSubmissions = detail.paymentSubmissions.filter((s) => s.status === 'Pending');
  const hasPendingReview = effectiveStatus !== 'Paid' && pendingSubmissions.length > 0;
  const verifiedSubmission = detail.paymentSubmissions.find((s) => s.status === 'Verified');

  const scrollToPayNow = () => {
    document.getElementById('pay-now')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  return (
    <section className="max-w-4xl mx-auto space-y-6 page-enter">
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
          className="print:hidden flex items-start justify-between gap-3 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-text"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>{detail.paymentSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => detail.setPaymentSuccessMessage(null)}
            aria-label="Dismiss payment confirmation"
            className="p-0.5 rounded-lg hover:bg-success/15 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {detail.paymentError && (
        <div className="print:hidden">
          <ErrorAlert
            message={detail.paymentError}
            onDismiss={() => detail.setPaymentError(null)}
          />
        </div>
      )}

      {detail.submissionsError && (
        <div className="print:hidden">
          <ErrorAlert
            message={getErrorMessage(
              detail.submissionsError,
              'Unable to load payment submissions for this invoice.',
            )}
            onRetry={() => void detail.refetchSubmissions()}
            retrying={detail.isRetryingSubmissions}
          />
        </div>
      )}

      <InvoiceSheet
        invoice={invoice}
        effectiveStatus={effectiveStatus}
        hasPendingReview={hasPendingReview}
        hiddenWhenPrintingReceipt={detail.printMode === 'receipt'}
      />

      {!detail.isAdmin && effectiveStatus !== 'Paid' && amount > 0 && (
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
            nextInvoiceNumber={invoice.invoiceNumber || 'SD-INV-001'}
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
