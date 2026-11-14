import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Pencil,
  Printer,
  Receipt,
  X,
  XCircle,
} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Link, useLocation, useParams} from 'react-router-dom';
import {InvoiceFormModal} from '../components/InvoiceFormModal';
import {MarkPaidModal} from '../components/MarkPaidModal';
import {PayNowPanel} from '../components/PayNowPanel';
import {RejectPaymentModal} from '../components/RejectPaymentModal';
import {useAuth} from '../context/AuthContext';
import {useToast} from '../context/ToastContext';
import {queryKeys} from '../lib/queryKeys';
import {list as listClients} from '../services/clients';
import {
  getById as getInvoiceById,
  markPaid as markInvoicePaid,
  update as updateInvoice,
} from '../services/invoices';
import {
  create as createPaymentSubmission,
  list as listPaymentSubmissions,
  rejectSubmission,
  verifyAndMarkInvoicePaid,
} from '../services/payments';
import {list as listProjects} from '../services/projects';
import {getErrorMessage} from '../services/serviceUtils';
import type {
  InvoiceFormParsed,
  InvoiceRecord,
  InvoiceStatus,
  MarkPaidFormParsed,
  PaymentSubmissionFormParsed,
  PaymentSubmissionRecord,
  PaymentSubmissionStatus,
} from '../types/portal';
import {formatBDT, formatDateDisplay, formatDateTime} from '../utils/format';
import {downloadInvoicePdf} from '../utils/invoicePdf';
import {
  AGENCY_ADDRESS,
  AGENCY_NAME,
  AGENCY_PHONE,
  getEffectiveInvoiceStatus,
} from '../utils/invoices';
import {createNotification} from '../utils/notifications';

const STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Sent: 'bg-amber-50 text-amber-700 border-amber-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
};

const SUBMISSION_STATUS_CLASSES: Record<PaymentSubmissionStatus, string> = {
  Pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Verified:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
  Rejected:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
};

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

  const {
    data: rawInvoice = null,
    isLoading: loading,
    error: invoiceError,
  } = useQuery({
    queryKey: queryKeys.invoices.detail(invoiceId ?? ''),
    queryFn: () => getInvoiceById(invoiceId ?? ''),
    enabled: Boolean(invoiceId && user),
  });

  const accessDenied = Boolean(
    rawInvoice &&
      !isAdmin &&
      (rawInvoice.clientId !== user?.clientId || rawInvoice.status === 'Draft'),
  );
  const invoice = rawInvoice && !accessDenied ? rawInvoice : null;

  const {data: paymentSubmissions = []} = useQuery({
    queryKey: queryKeys.payments.list(invoiceId),
    queryFn: () => listPaymentSubmissions({invoiceId}),
    enabled: Boolean(invoiceId && invoice),
  });

  const {data: clients = []} = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => listClients(),
    enabled: isAdmin,
  });

  const {data: projects = []} = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const list = await listProjects();
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode('invoice');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
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
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
      }, 40);
    });
  };

  const scrollToPayNow = () => {
    document.getElementById('pay-now')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  const invalidateInvoiceAndPayments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({queryKey: queryKeys.invoices.detail(invoiceId ?? '')}),
      queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix}),
      queryClient.invalidateQueries({queryKey: queryKeys.payments.prefix}),
    ]);
  };

  const verifyMutation = useMutation({
    mutationFn: (submission: PaymentSubmissionRecord) =>
      verifyAndMarkInvoicePaid(submission),
    onSuccess: () => invalidateInvoiceAndPayments(),
  });

  const rejectMutation = useMutation({
    mutationFn: ({submissionId, reason}: {submissionId: string; reason: string}) =>
      rejectSubmission(submissionId, reason),
    onSuccess: () => invalidateInvoiceAndPayments(),
  });

  const handleSaveEdit = async (values: InvoiceFormParsed) => {
    if (!invoice || !isAdmin) return;
    setPaymentError(null);
    const lineItems = values.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      total: Math.round(li.quantity * li.unitPrice),
    }));
    const amount = lineItems.reduce((sum, li) => sum + li.total, 0);

    try {
      const updated = await updateInvoice(invoice.id, {
        clientId: values.clientId,
        projectId: values.projectId,
        lineItems,
        totalBdt: amount,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        notes: values.notes,
        status: values.status,
        paymentMethod: values.status === 'Paid' ? invoice.paymentMethod || 'Bank' : null,
        paymentReference: values.status === 'Paid' ? invoice.paymentReference : null,
        paidAt:
          values.status === 'Paid'
            ? typeof invoice.paidAt === 'string'
              ? invoice.paidAt
              : new Date().toISOString()
            : null,
      });

      await invalidateInvoiceAndPayments();

      if (invoice.status === 'Draft' && values.status !== 'Draft' && user) {
        await createNotification({
          recipientRole: 'client',
          clientId: values.clientId,
          projectId: values.projectId,
          type: 'invoice',
          title: `New invoice ${updated.invoiceNumber}`,
          body: `Amount: ${formatBDT(amount)} · Due ${formatDateDisplay(values.dueDate)}`,
          link: `/invoices/${invoice.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to update invoice.'));
      throw err;
    }
  };

  const handleConfirmMarkPaid = async (
    target: InvoiceRecord,
    values: MarkPaidFormParsed,
  ) => {
    if (!isAdmin) return;
    setPaymentError(null);
    try {
      await markInvoicePaid(target.id, values.paymentMethod, values.paymentReference);
      await invalidateInvoiceAndPayments();
      if (user) {
        await createNotification({
          recipientRole: 'client',
          clientId: target.clientId,
          projectId: target.projectId,
          type: 'invoice',
          title: `Payment recorded: ${target.invoiceNumber}`,
          body: `${formatBDT(target.amount)} marked paid via ${values.paymentMethod}.`,
          link: `/invoices/${target.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
      toast.success('Invoice marked Paid', `${target.invoiceNumber} has been marked Paid.`);
    } catch (err) {
      const msg = getErrorMessage(err, 'Unable to mark invoice as paid.');
      setPaymentError(msg);
      toast.error('Update failed', msg);
    }
  };

  const handleSubmitPaymentProof = async (
    target: InvoiceRecord,
    values: PaymentSubmissionFormParsed,
  ) => {
    if (!user) return;
    setPaymentError(null);
    await createPaymentSubmission({
      invoiceId: target.id,
      submittedBy: user.id,
      method: values.method,
      senderNumber: values.senderNumber,
      transactionId: values.transactionId,
      amountBdt: values.amountBdt,
    });
    await queryClient.invalidateQueries({queryKey: queryKeys.payments.prefix});
    setPaymentSuccessMessage(
      `Payment proof (${values.method} · ${values.transactionId}) submitted. Your invoice is now marked as Payment under review.`,
    );
    toast.success(
      'Payment proof submitted',
      `${values.method} TrxID ${values.transactionId} is under review.`,
    );
  };

  const handleVerifySubmission = async (submission: PaymentSubmissionRecord) => {
    if (!isAdmin || !invoice || processingSubId || submission.status !== 'Pending') return;
    setPaymentError(null);
    setProcessingSubId(submission.id);
    try {
      await verifyMutation.mutateAsync(submission);
      if (user) {
        await createNotification({
          recipientRole: 'client',
          clientId: invoice.clientId,
          projectId: invoice.projectId,
          type: 'invoice',
          title: `Payment verified: ${invoice.invoiceNumber}`,
          body: `${formatBDT(submission.amountBdt)} verified via ${submission.method} (TrxID: ${submission.transactionId}).`,
          link: `/invoices/${invoice.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
      toast.success(
        'Payment verified',
        `${invoice.invoiceNumber} is now marked Paid.`,
      );
    } catch (err) {
      const msg = getErrorMessage(err, 'Unable to verify payment submission.');
      setPaymentError(msg);
      toast.error('Verification failed', msg);
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleRejectSubmission = async (
    submission: PaymentSubmissionRecord,
    reason: string,
  ) => {
    if (!isAdmin || !invoice || processingSubId || submission.status !== 'Pending') return;
    setPaymentError(null);
    setProcessingSubId(submission.id);
    try {
      await rejectMutation.mutateAsync({submissionId: submission.id, reason});
      if (user) {
        await createNotification({
          recipientRole: 'client',
          clientId: invoice.clientId,
          projectId: invoice.projectId,
          type: 'invoice',
          title: `Payment submission rejected: ${invoice.invoiceNumber}`,
          body: `Reason: ${reason}`,
          link: `/invoices/${invoice.id}#pay-now`,
          actorUid: user.id,
          actorName: user.name,
        });
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Invoice unavailable
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {invoiceError
            ? getErrorMessage(
                invoiceError,
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

  const effectiveStatus = getEffectiveInvoiceStatus(invoice);
  const pendingSubmissions = paymentSubmissions.filter((s) => s.status === 'Pending');
  const hasPendingReview = effectiveStatus !== 'Paid' && pendingSubmissions.length > 0;
  const verifiedSubmission = paymentSubmissions.find((s) => s.status === 'Verified');
  const receiptNumber = `RCP-${invoice.invoiceNumber.replace(/^SD-/, '')}`;

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Invoices</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && effectiveStatus !== 'Paid' && (
            <button
              type="button"
              onClick={() => setIsMarkPaidOpen(true)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Mark Paid</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              <span>Edit</span>
            </button>
          )}

          {!isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
            <button
              type="button"
              onClick={scrollToPayNow}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <CreditCard className="w-4 h-4" aria-hidden="true" />
              <span>{hasPendingReview ? 'Payment Under Review' : 'Pay Now'}</span>
            </button>
          )}

          {effectiveStatus === 'Paid' && (
            <button
              type="button"
              onClick={() => handlePrint('receipt')}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors"
            >
              <Receipt className="w-4 h-4" aria-hidden="true" />
              <span>Print Receipt</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handlePrint('invoice')}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => downloadInvoicePdf(invoice)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {paymentSuccessMessage && (
        <div
          role="status"
          className="print:hidden flex items-start justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{paymentSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessMessage(null)}
            aria-label="Dismiss payment confirmation"
            className="p-0.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {paymentError && (
        <div
          role="alert"
          className="print:hidden flex items-start justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{paymentError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentError(null)}
            aria-label="Dismiss payment error"
            className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Printable Invoice Sheet */}
      <article
        className={`bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none ${
          printMode === 'receipt' ? 'print:hidden' : ''
        }`}
      >
        <div className="h-2 bg-indigo-600" />

        <div className="p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-indigo-700">
                {AGENCY_NAME}
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">{AGENCY_ADDRESS}</p>
              <p className="text-sm text-slate-600 tabular-nums">Phone: {AGENCY_PHONE}</p>
            </div>

            <div className="sm:text-right space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Invoice
              </p>
              <p className="text-xl font-bold text-slate-900 tabular-nums">
                {invoice.invoiceNumber}
              </p>
              <div className="flex flex-wrap sm:justify-end items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE_CLASSES[effectiveStatus]}`}
                >
                  {effectiveStatus}
                </span>
                {hasPendingReview && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    Payment under review
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bill To & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bill To
              </p>
              <p className="mt-1.5 text-base font-semibold text-slate-900">
                {invoice.clientName || 'Client'}
              </p>
              {invoice.clientEmail && (
                <p className="text-sm text-slate-600">{invoice.clientEmail}</p>
              )}
              {invoice.projectTitle && (
                <p className="mt-1 text-sm text-slate-600">
                  Project: <span className="font-medium text-slate-800">{invoice.projectTitle}</span>
                </p>
              )}
            </div>

            <dl className="sm:text-right space-y-2 text-sm">
              <div className="flex sm:justify-end gap-4">
                <dt className="text-slate-500">Issue Date:</dt>
                <dd className="font-medium text-slate-900 tabular-nums">
                  {formatDateDisplay(invoice.issueDate)}
                </dd>
              </div>
              <div className="flex sm:justify-end gap-4">
                <dt className="text-slate-500">Due Date:</dt>
                <dd
                  className={`font-semibold tabular-nums ${
                    effectiveStatus === 'Overdue' ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {formatDateDisplay(invoice.dueDate)}
                </dd>
              </div>
              <div className="flex sm:justify-end gap-4">
                <dt className="text-slate-500">Currency:</dt>
                <dd className="font-medium text-slate-900">BDT (৳)</dd>
              </div>
            </dl>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-4 text-slate-900 font-medium">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                      {formatBDT(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatBDT(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Summary */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="text-xs text-slate-500 max-w-md space-y-2">
              {effectiveStatus !== 'Paid' && (
                <p>
                  Pay via bKash, Nagad, or Bank transfer and submit your Transaction ID below in the &ldquo;Pay Now&rdquo; section, referencing{' '}
                  <span className="font-semibold text-slate-800">{invoice.invoiceNumber}</span>.
                </p>
              )}
            </div>

            <div className="w-full sm:w-72 rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-indigo-900">
                {effectiveStatus === 'Paid' ? 'Total Paid' : 'Total Due'}
              </span>
              <span className="text-xl font-bold text-indigo-700 tabular-nums">
                {formatBDT(invoice.amount)}
              </span>
            </div>
          </div>

          {/* Paid Confirmation Details */}
          {effectiveStatus === 'Paid' && invoice.paymentMethod && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Payment Recorded
              </p>
              <p className="text-sm font-medium text-slate-900">
                Paid via <span className="font-semibold">{invoice.paymentMethod}</span>
                {invoice.paidAt ? ` on ${formatDateTime(invoice.paidAt)}` : ''}
              </p>
              {invoice.paymentReference && (
                <p className="text-xs text-slate-600 font-mono">
                  Reference: {invoice.paymentReference}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Notes
              </p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Printable Footer */}
          <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            {AGENCY_ADDRESS} · {AGENCY_PHONE} · Thank you for choosing Stack Dev.
          </div>
        </div>
      </article>

      {/* Client Manual Pay Now Panel (unpaid invoices) */}
      {!isAdmin && effectiveStatus !== 'Paid' && invoice.amount > 0 && (
        <PayNowPanel
          invoice={invoice}
          existingSubmissions={paymentSubmissions}
          onSubmitProof={(values) => handleSubmitPaymentProof(invoice, values)}
        />
      )}

      {/* Official Printable Payment Receipt (Paid invoices) */}
      {effectiveStatus === 'Paid' && (
        <article
          aria-label="Official Payment Receipt"
          className={`bg-white text-slate-900 rounded-2xl border border-emerald-200 shadow-sm overflow-hidden print:border print:border-slate-300 print:shadow-none print:rounded-none ${
            printMode === 'receipt' ? 'print:block' : 'print:hidden'
          }`}
        >
          <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Receipt</h3>
                <p className="text-xs text-slate-600 tabular-nums">{receiptNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-300 bg-white text-emerald-700">
                PAID IN FULL
              </span>
              <button
                type="button"
                onClick={() => handlePrint('receipt')}
                className="print:hidden inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <p className="text-lg font-bold text-indigo-700">{AGENCY_NAME}</p>
                <p className="text-xs text-slate-600">{AGENCY_ADDRESS}</p>
                <p className="text-xs text-slate-600 tabular-nums">{AGENCY_PHONE}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-slate-500">Amount Received</p>
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {formatBDT(invoice.amount)}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Received From</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">
                  {invoice.clientName || 'Client'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Invoice Reference</dt>
                <dd className="font-semibold text-slate-900 tabular-nums mt-0.5">
                  {invoice.invoiceNumber}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Project</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {invoice.projectTitle || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Payment Date</dt>
                <dd className="font-medium text-slate-800 tabular-nums mt-0.5">
                  {invoice.paidAt ? formatDateTime(invoice.paidAt) : formatDateDisplay(invoice.issueDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Payment Method</dt>
                <dd className="font-medium text-slate-800 mt-0.5">
                  {invoice.paymentMethod || verifiedSubmission?.method || 'Recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Transaction Reference / TrxID</dt>
                <dd className="font-mono font-semibold text-slate-900 mt-0.5">
                  {invoice.paymentReference || verifiedSubmission?.transactionId || 'Manual confirmation'}
                </dd>
              </div>
              {verifiedSubmission?.senderNumber && (
                <div>
                  <dt className="text-xs text-slate-500">Sender Account / Number</dt>
                  <dd className="font-mono text-slate-800 mt-0.5 tabular-nums">
                    {verifiedSubmission.senderNumber}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-500">Verification Status</dt>
                <dd className="font-medium text-emerald-700 mt-0.5">
                  Verified by Stack Dev
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
              This is an official payment receipt generated by {AGENCY_NAME} Client Portal.
            </div>
          </div>
        </article>
      )}

      {/* Payment History (hidden when printing) */}
      {(paymentSubmissions.length > 0 || effectiveStatus === 'Paid') && (
        <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Payment History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All submitted bKash, Nagad, Bank, and admin-recorded payment entries for this invoice.
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {paymentSubmissions.length} submission{paymentSubmissions.length === 1 ? '' : 's'}
            </span>
          </div>

          {effectiveStatus === 'Paid' && paymentSubmissions.length === 0 && (
            <div className="px-6 py-4 text-sm flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {invoice.paymentMethod || 'Direct Payment'} · {formatBDT(invoice.amount)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                  {invoice.paymentReference
                    ? `Reference: ${invoice.paymentReference} · `
                    : ''}
                  {invoice.paidAt ? `Recorded ${formatDateTime(invoice.paidAt)}` : 'Marked Paid'}
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60">
                Paid
              </span>
            </div>
          )}

          {paymentSubmissions.length > 0 && (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {paymentSubmissions.map((sub) => {
                const isBusy = processingSubId === sub.id;
                const canAdminVerify =
                  isAdmin && sub.status === 'Pending' && effectiveStatus !== 'Paid';

                return (
                  <li
                    key={sub.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {sub.method} · {formatBDT(sub.amountBdt)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SUBMISSION_STATUS_CLASSES[sub.status]}`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        TrxID:{' '}
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                          {sub.transactionId}
                        </span>{' '}
                        · Sender: <span className="font-mono">{sub.senderNumber}</span> · Submitted{' '}
                        {formatDateTime(sub.createdAt)}
                      </p>
                      {sub.status === 'Verified' && sub.verifiedAt && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                          Verified {formatDateTime(sub.verifiedAt)}
                        </p>
                      )}
                      {sub.status === 'Rejected' && sub.rejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Rejection reason: {sub.rejectionReason}
                        </p>
                      )}
                    </div>

                    {isAdmin && sub.status === 'Pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        {canAdminVerify && (
                          <button
                            type="button"
                            disabled={Boolean(processingSubId)}
                            onClick={() => void handleVerifySubmission(sub)}
                            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isBusy ? 'Verifying...' : 'Verify'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={Boolean(processingSubId)}
                          onClick={() => setRejectTarget(sub)}
                          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-xs font-semibold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {isAdmin && (
        <>
          <InvoiceFormModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSave={handleSaveEdit}
            clients={clients}
            projects={projects}
            nextInvoiceNumber={invoice.invoiceNumber}
            initialInvoice={invoice}
          />
          <MarkPaidModal
            invoice={isMarkPaidOpen ? invoice : null}
            onClose={() => setIsMarkPaidOpen(false)}
            onConfirm={handleConfirmMarkPaid}
          />
          <RejectPaymentModal
            submission={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirmReject={handleRejectSubmission}
          />
        </>
      )}
    </section>
  );
}
