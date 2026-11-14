import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {useInvoiceMutations} from '@/features/invoices/useInvoiceMutations';
import {useAuth} from '@/hooks/useAuth';
import {useToast} from '@/hooks/useToast';
import {queryKeys} from '@/lib/queryKeys';
import {list as listClients} from '@/services/clients';
import {getById as getInvoiceById} from '@/services/invoices';
import {
  create as createPaymentSubmission,
  list as listPaymentSubmissions,
  rejectSubmission,
  verifyAndMarkInvoicePaid,
} from '@/services/payments';
import {list as listProjects} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  InvoiceFormParsed,
  InvoiceRecord,
  MarkPaidFormParsed,
  PaymentSubmissionFormParsed,
  PaymentSubmissionRecord,
} from '@/types/portal';
import {formatBDT} from '@/utils/format';
import {createNotification} from '@/utils/notifications';

export function useInvoiceDetail(invoiceId: string | undefined) {
  const location = useLocation();
  const {user} = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const {saveInvoice, markPaid, invalidateAll} = useInvoiceMutations(invoiceId);

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
    rawInvoice && !isAdmin && (rawInvoice.clientId !== user?.clientId || rawInvoice.status === 'Draft'),
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
    const handleAfterPrint = () => setPrintMode('invoice');
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

  const verifyMutation = useMutation({
    mutationFn: (submission: PaymentSubmissionRecord) => verifyAndMarkInvoicePaid(submission),
    onSuccess: () => invalidateAll(),
  });

  const rejectMutation = useMutation({
    mutationFn: ({submissionId, reason}: {submissionId: string; reason: string}) =>
      rejectSubmission(submissionId, reason),
    onSuccess: () => invalidateAll(),
  });

  const handlePrint = (mode: 'invoice' | 'receipt') => {
    setPrintMode(mode);
    window.requestAnimationFrame(() => {
      window.setTimeout(() => window.print(), 40);
    });
  };

  const handleSaveEdit = async (values: InvoiceFormParsed) => {
    if (!invoice || !isAdmin) return;
    setPaymentError(null);
    try {
      await saveInvoice({values, editingInvoice: invoice, user});
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to update invoice.'));
      throw err;
    }
  };

  const handleConfirmMarkPaid = async (target: InvoiceRecord, values: MarkPaidFormParsed) => {
    if (!isAdmin) return;
    setPaymentError(null);
    try {
      await markPaid({invoice: target, values, user});
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
      toast.success('Payment verified', `${invoice.invoiceNumber} is now marked Paid.`);
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

  return {
    isAdmin,
    loading,
    invoiceError,
    accessDenied,
    invoice,
    paymentSubmissions,
    clients,
    projects,
    isEditOpen,
    setIsEditOpen,
    isMarkPaidOpen,
    setIsMarkPaidOpen,
    rejectTarget,
    setRejectTarget,
    processingSubId,
    printMode,
    paymentError,
    setPaymentError,
    paymentSuccessMessage,
    setPaymentSuccessMessage,
    handlePrint,
    handleSaveEdit,
    handleConfirmMarkPaid,
    handleSubmitPaymentProof,
    handleVerifySubmission,
    handleRejectSubmission,
  };
}
