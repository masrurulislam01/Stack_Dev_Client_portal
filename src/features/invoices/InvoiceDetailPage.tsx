import {useQueryClient} from '@tanstack/react-query';
import {AlertCircle, ArrowLeft, CheckCircle2, CreditCard, Download, Pencil, Printer, Receipt, X} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useParams} from 'react-router-dom';
import {InvoiceFormModal} from '@/features/invoices/InvoiceFormModal';
import {markPaidAndNotify, saveInvoiceAndNotify} from '@/features/invoices/invoiceHelpers';
import {InvoicePaymentHistory} from '@/features/invoices/InvoicePaymentHistory';
import {InvoiceReceiptSheet} from '@/features/invoices/InvoiceReceiptSheet';
import {InvoiceSheet} from '@/features/invoices/InvoiceSheet';
import {MarkPaidModal} from '@/features/invoices/MarkPaidModal';
import {PayNowPanel} from '@/features/payments/PayNowPanel';
import {RejectPaymentModal} from '@/features/payments/RejectPaymentModal';
import {
  useAuth,
  useClients,
  useInvoiceDetail,
  usePaymentSubmissions,
  useProjects,
  useRejectPaymentMutation,
  useToast,
  useVerifyPaymentMutation,
} from '@/hooks';
import {formatBDT} from '@/lib/constants';
import {queryKeys} from '@/lib/queryKeys';
import {create as createPaymentSubmission} from '@/services/payments';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  InvoiceFormParsed,
  InvoiceRecord,
  MarkPaidFormParsed,
  PaymentSubmissionFormParsed,
  PaymentSubmissionRecord,
} from '@/types/portal';
import {downloadInvoicePdf} from '@/utils/invoicePdf';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';
import {createNotification} from '@/utils/notifications';

export function InvoiceDetailPage() {
  const {invoiceId} = useParams<{invoiceId: string}>();
  const location = useLocation();
  const {user} = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PaymentSubmissionRecord | null>(null);
  const [processingSubId, setProcessingSubId] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'invoice' | 'receipt'>('invoice');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  const {data: rawInvoice = null, isLoading: loading, error: invoiceError} = useInvoiceDetail(
    invoiceId ?? '',
    Boolean(invoiceId && user),
  );
  const accessDenied = Boolean(
    rawInvoice && !isAdmin && (rawInvoice.clientId !== user?.clientId || rawInvoice.status === 'Draft'),
  );
  const invoice = rawInvoice && !accessDenied ? rawInvoice : null;

  const {data: paymentSubmissions = []} = usePaymentSubmissions(
    {invoiceId},
    invoiceId,
    Boolean(invoiceId && invoice),
  );
  const {data: clients = []} = useClients(isAdmin);
  const {data: rawProjects = []} = useProjects(undefined, isAdmin);
  const projects = useMemo(
    () => [...rawProjects].sort((a, b) => a.title.localeCompare(b.title)),
    [rawProjects],
  );
  const verifyMutation = useVerifyPaymentMutation();
  const rejectMutation = useRejectPaymentMutation();

  useEffect(() => {
    const onAfterPrint = () => setPrintMode('invoice');
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  useEffect(() => {
    if (location.hash === '#pay-now' && invoice && !isAdmin) {
      const timer = window.setTimeout(() => {
        document.getElementById('pay-now')?.scrollIntoView({behavior: 'smooth', block: 'start'});
      }, 100);
      return () => window.clearTimeout(timer);
    }
  }, [location.hash, invoice, isAdmin]);

  const handlePrint = (mode: 'invoice' | 'receipt') => {
    setPrintMode(mode);
    window.requestAnimationFrame(() => window.setTimeout(() => window.print(), 40));
  };

  const handleSaveEdit = async (values: InvoiceFormParsed) => {
    if (!invoice || !isAdmin || !user) return;
    setPaymentError(null);
    try {
      await saveInvoiceAndNotify({values, editingInvoice: invoice, actor: {id: user.id, name: user.name}, queryClient});
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to update invoice.'));
      throw err;
    }
  };

  const handleConfirmMarkPaid = async (target: InvoiceRecord, values: MarkPaidFormParsed) => {
    if (!isAdmin || !user) return;
    setPaymentError(null);
    try {
      await markPaidAndNotify({invoice: target, values, actor: {id: user.id, name: user.name}, queryClient});
      toast.success('Invoice marked Paid', `${target.invoiceNumber} has been marked Paid.`);
    } catch (err) {
      const msg = getErrorMessage(err, 'Unable to mark invoice as paid.');
      setPaymentError(msg);
      toast.error('Update failed', msg);
    }
  };

  const handleSubmitPaymentProof = async (target: InvoiceRecord, values: PaymentSubmissionFormParsed) => {
    if (!user) return;
    setPaymentError(null);
    await createPaymentSubmission({invoiceId: target.id, submittedBy: user.id, ...values});
    await queryClient.invalidateQueries({queryKey: queryKeys.payments.prefix});
    setPaymentSuccessMessage(`Payment proof (${values.method} · ${values.transactionId}) submitted. Your invoice is now marked as Payment under review.`);
    toast.success('Payment proof submitted', `${values.method} TrxID ${values.transactionId} is under review.`);
  };

  const handleVerifySubmission = async (sub: PaymentSubmissionRecord) => {
    if (!isAdmin || !invoice || processingSubId || sub.status !== 'Pending') return;
    setPaymentError(null);
    setProcessingSubId(sub.id);
    try {
      await verifyMutation.mutateAsync(sub);
      if (user) {
        await createNotification({recipientRole: 'client', clientId: invoice.clientId, projectId: invoice.projectId, type: 'invoice', title: `Payment verified: ${invoice.invoiceNumber}`, body: `${formatBDT(sub.amountBdt)} verified via ${sub.method} (TrxID: ${sub.transactionId}).`, link: `/invoices/${invoice.id}`, actorUid: user.id, actorName: user.name});
      }
      toast.success('Payment verified', `${invoice.invoiceNumber} is now marked Paid.`);
    } catch (err) {
      const msg = getErrorMessage(err, 'Unable to verify payment submission.');
      setPaymentError(msg);
      toast.error('Verification failed', msg);
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleRejectSubmission = async (sub: PaymentSubmissionRecord, reason: string) => {
    if (!isAdmin || !invoice || processingSubId || sub.status !== 'Pending') return;
    setPaymentError(null);
    setProcessingSubId(sub.id);
    try {
      await rejectMutation.mutateAsync({submissionId: sub.id, invoiceId: invoice.id, reason});
      if (user) {
        await createNotification({recipientRole: 'client', clientId: invoice.clientId, projectId: invoice.projectId, type: 'invoice', title: `Payment submission rejected: ${invoice.invoiceNumber}`, body: `Reason: ${reason}`, link: `/invoices/${invoice.id}#pay-now`, actorUid: user.id, actorName: user.name});
      }
      toast.info('Payment rejected', 'Client has been notified with the rejection reason.');
    } catch (err) {
      const msg = getErrorMessage(err, 'Unable to reject payment submission.');
      setPaymentError(msg);
      toast.error('Rejection failed', msg);
      throw err;
    } finally {
      setProcessingSubId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-44 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-[540px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  if (!invoice || accessDenied) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Invoice unavailable</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {invoiceError ? getErrorMessage(invoiceError, 'We could not find this invoice, or it has not been published to your account yet.') : 'We could not find this invoice, or it has not been published to your account yet.'}
        </p>
        <Link to="/invoices" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /><span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  const effectiveStatus = getEffectiveInvoiceStatus(invoice);
  const hasPendingReview = effectiveStatus !== 'Paid' && paymentSubmissions.some((s) => s.status === 'Pending');
  const verifiedSubmission = paymentSubmissions.find((s) => s.status === 'Verified');

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /><span>Back to Invoices</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && effectiveStatus !== 'Paid' && (
            <button type="button" onClick={() => setIsMarkPaidOpen(true)} className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /><span>Mark Paid</span>
            </button>
          )}
          {isAdmin && (
            <button type="button" onClick={() => setIsEditOpen(true)} className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Pencil className="w-4 h-4" aria-hidden="true" /><span>Edit</span>
            </button>
          )}
          {!isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
            <button type="button" onClick={() => document.getElementById('pay-now')?.scrollIntoView({behavior: 'smooth', block: 'start'})} className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
              <CreditCard className="w-4 h-4" aria-hidden="true" /><span>{hasPendingReview ? 'Payment Under Review' : 'Pay Now'}</span>
            </button>
          )}
          {effectiveStatus === 'Paid' && (
            <button type="button" onClick={() => handlePrint('receipt')} className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors">
              <Receipt className="w-4 h-4" aria-hidden="true" /><span>Print Receipt</span>
            </button>
          )}
          <button type="button" onClick={() => handlePrint('invoice')} className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Printer className="w-4 h-4" aria-hidden="true" /><span>Print</span>
          </button>
          <button type="button" onClick={() => downloadInvoicePdf(invoice)} className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors">
            <Download className="w-4 h-4" aria-hidden="true" /><span>Download PDF</span>
          </button>
        </div>
      </div>

      {paymentSuccessMessage && (
        <div role="status" className="print:hidden flex items-start justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /><span>{paymentSuccessMessage}</span></div>
          <button type="button" onClick={() => setPaymentSuccessMessage(null)} aria-label="Dismiss payment confirmation" className="p-0.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"><X className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      )}

      {paymentError && (
        <div role="alert" className="print:hidden flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-start gap-2.5"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /><span>{paymentError}</span></div>
          <button type="button" onClick={() => setPaymentError(null)} aria-label="Dismiss payment error" className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"><X className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      )}

      <InvoiceSheet invoice={invoice} effectiveStatus={effectiveStatus} hasPendingReview={hasPendingReview} hideForReceiptPrint={printMode === 'receipt'} />
      {!isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
        <PayNowPanel invoice={invoice} existingSubmissions={paymentSubmissions} onSubmitProof={(values) => handleSubmitPaymentProof(invoice, values)} />
      )}
      {effectiveStatus === 'Paid' && (
        <InvoiceReceiptSheet invoice={invoice} verifiedSubmission={verifiedSubmission} showForPrint={printMode === 'receipt'} onPrintReceipt={() => handlePrint('receipt')} />
      )}
      <InvoicePaymentHistory invoice={invoice} effectiveStatus={effectiveStatus} paymentSubmissions={paymentSubmissions} isAdmin={isAdmin} processingSubId={processingSubId} onVerify={(sub) => void handleVerifySubmission(sub)} onReject={setRejectTarget} />
      {isAdmin && (
        <>
          <InvoiceFormModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={handleSaveEdit} clients={clients} projects={projects} nextInvoiceNumber={invoice.invoiceNumber} initialInvoice={invoice} />
          <MarkPaidModal invoice={isMarkPaidOpen ? invoice : null} onClose={() => setIsMarkPaidOpen(false)} onConfirm={handleConfirmMarkPaid} />
          <RejectPaymentModal submission={rejectTarget} onClose={() => setRejectTarget(null)} onConfirmReject={handleRejectSubmission} />
        </>
      )}
    </section>
  );
}
