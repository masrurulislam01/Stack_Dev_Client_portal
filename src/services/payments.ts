import type {
  InvoiceStatus,
  PaymentSubmissionMethod,
  PaymentSubmissionStatus,
} from '@/config/constants';
import {supabase} from '@/lib/supabase';
import {assertSafeRecordId, getErrorMessage, parseServiceInput} from '@/services/serviceUtils';
import type {
  DbInvoiceStatus,
  DbPaymentSubmissionMethod,
  DbPaymentSubmissionStatus,
  PaymentSubmissionRow,
} from '@/types/database';
import type {PaymentSubmissionRecord} from '@/types/portal';
import {
  createPaymentSubmissionInputSchema,
  rejectPaymentInputSchema,
  updatePaymentSubmissionInputSchema,
} from '@/types/schemas';

interface PaymentJoinedRow extends PaymentSubmissionRow {
  invoices?: {
    invoice_number?: string | null;
    client_id?: string | null;
    project_id?: string | null;
    status?: DbInvoiceStatus | null;
    total_bdt?: number | null;
    clients?: {company_name?: string | null; contact_name?: string | null} | null;
    projects?: {title?: string | null} | null;
  } | null;
  profiles?: {full_name?: string | null} | null;
}

export interface ListPaymentSubmissionsOptions {
  invoiceId?: string;
  status?: PaymentSubmissionStatus;
}

export interface CreatePaymentSubmissionInput {
  invoiceId: string;
  submittedBy: string;
  method: PaymentSubmissionMethod;
  senderNumber: string;
  transactionId: string;
  amountBdt: number;
}

export interface UpdatePaymentSubmissionInput {
  status?: PaymentSubmissionStatus;
  method?: PaymentSubmissionMethod;
  senderNumber?: string;
  transactionId?: string;
  amountBdt?: number;
  rejectionReason?: string;
}

function mapPaymentRow(row: PaymentJoinedRow): PaymentSubmissionRecord {
  const method: PaymentSubmissionMethod =
    row.method === 'Nagad' || row.method === 'Bank' ? row.method : 'bKash';
  const status: PaymentSubmissionStatus =
    row.status === 'Verified' || row.status === 'Rejected' ? row.status : 'Pending';
  const rawInvoiceStatus = row.invoices?.status;
  const invoiceStatus: InvoiceStatus =
    rawInvoiceStatus === 'Draft' ||
    rawInvoiceStatus === 'Paid' ||
    rawInvoiceStatus === 'Overdue'
      ? rawInvoiceStatus
      : 'Sent';

  const clientName =
    row.invoices?.clients?.company_name?.trim() ||
    row.invoices?.clients?.contact_name?.trim() ||
    row.profiles?.full_name?.trim() ||
    'Client';

  return {
    id: String(row.id),
    invoiceId: String(row.invoice_id ?? ''),
    invoiceNumber: String(row.invoices?.invoice_number ?? ''),
    invoiceStatus,
    invoiceAmountBdt: Number(row.invoices?.total_bdt ?? 0),
    clientId: String(row.invoices?.client_id ?? ''),
    clientName,
    projectId: String(row.invoices?.project_id ?? ''),
    projectTitle: String(row.invoices?.projects?.title ?? ''),
    submittedBy: String(row.submitted_by ?? ''),
    submittedByName: String(row.profiles?.full_name ?? clientName),
    method,
    senderNumber: String(row.sender_number ?? ''),
    transactionId: String(row.transaction_id ?? ''),
    amountBdt: Number(row.amount_bdt ?? 0),
    status,
    rejectionReason: String(row.rejection_reason ?? ''),
    verifiedBy: row.verified_by ? String(row.verified_by) : null,
    verifiedAt: row.verified_at ? String(row.verified_at) : null,
    createdAt: row.created_at,
  };
}

const PAYMENT_SELECT =
  'id, invoice_id, submitted_by, method, sender_number, transaction_id, amount_bdt, status, rejection_reason, verified_by, verified_at, created_at, invoices(invoice_number, client_id, project_id, status, total_bdt, clients(company_name, contact_name), projects(title)), profiles!payment_submissions_submitted_by_fkey(full_name)';

const PAYMENT_SELECT_FALLBACK =
  'id, invoice_id, submitted_by, method, sender_number, transaction_id, amount_bdt, status, rejection_reason, verified_by, verified_at, created_at, invoices(invoice_number, client_id, project_id, status, total_bdt, clients(company_name, contact_name), projects(title))';

async function selectWithFallback(
  buildQuery: (selectStr: string) => Promise<{data: unknown; error: unknown}>,
): Promise<PaymentJoinedRow[]> {
  const first = await buildQuery(PAYMENT_SELECT);
  if (!first.error) {
    return (first.data ?? []) as PaymentJoinedRow[];
  }
  const msg =
    typeof first.error === 'object' && first.error !== null && 'message' in first.error
      ? String((first.error as {message?: unknown}).message ?? '')
      : '';
  if (msg.toLowerCase().includes('relationship') || msg.toLowerCase().includes('could not find')) {
    const second = await buildQuery(PAYMENT_SELECT_FALLBACK);
    if (!second.error) {
      return (second.data ?? []) as PaymentJoinedRow[];
    }
    throw new Error(getErrorMessage(second.error, 'Unable to load payment submissions.'));
  }
  throw new Error(getErrorMessage(first.error, 'Unable to load payment submissions.'));
}

export async function list(
  options: ListPaymentSubmissionsOptions = {},
): Promise<PaymentSubmissionRecord[]> {
  const rows = await selectWithFallback(async (selectStr) => {
    let query = supabase
      .from('payment_submissions')
      .select(selectStr)
      .order('created_at', {ascending: false});

    if (options.invoiceId) {
      query = query.eq('invoice_id', options.invoiceId);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    return await query;
  });

  return rows.map(mapPaymentRow);
}

export async function getById(id: string): Promise<PaymentSubmissionRecord | null> {
  const safeId = assertSafeRecordId(id, 'payment submission');
  const rows = await selectWithFallback(async (selectStr) => {
    return await supabase
      .from('payment_submissions')
      .select(selectStr)
      .eq('id', safeId)
      .limit(1);
  });

  if (rows.length === 0) return null;
  return mapPaymentRow(rows[0]);
}

export async function getByTransactionId(
  transactionId: string,
): Promise<PaymentSubmissionRecord | null> {
  if (!transactionId.trim()) return null;
  const rows = await selectWithFallback(async (selectStr) => {
    return await supabase
      .from('payment_submissions')
      .select(selectStr)
      .ilike('transaction_id', transactionId.trim())
      .order('created_at', {ascending: false})
      .limit(1);
  });

  if (rows.length === 0) return null;
  return mapPaymentRow(rows[0]);
}

export async function isTransactionIdTakenForInvoice(
  invoiceId: string,
  transactionId: string,
): Promise<boolean> {
  const cleanTrx = transactionId.trim();
  if (!invoiceId || !cleanTrx) return false;

  const {data, error} = await supabase
    .from('payment_submissions')
    .select('id')
    .eq('invoice_id', invoiceId)
    .ilike('transaction_id', cleanTrx)
    .limit(1);

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to validate Transaction ID uniqueness.'));
  }

  return Array.isArray(data) && data.length > 0;
}

export async function create(
  input: CreatePaymentSubmissionInput,
): Promise<PaymentSubmissionRecord> {
  const valid = parseServiceInput(createPaymentSubmissionInputSchema, input);
  const safeInvoiceId = assertSafeRecordId(valid.invoiceId, 'invoice');

  const {
    data: {session},
  } = await supabase.auth.getSession();
  const submittedBy = session?.user?.id || valid.submittedBy;

  const {data: invoiceRow, error: invoiceErr} = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', safeInvoiceId)
    .maybeSingle();

  if (invoiceErr) {
    throw new Error(getErrorMessage(invoiceErr, 'Unable to verify target invoice.'));
  }
  if (!invoiceRow) {
    throw new Error('Invoice not found or you do not have permission to pay this invoice.');
  }
  if (invoiceRow.status === 'Paid' || invoiceRow.status === 'Draft') {
    throw new Error('Payments can only be submitted for unpaid Sent or Overdue invoices.');
  }

  const duplicate = await isTransactionIdTakenForInvoice(safeInvoiceId, valid.transactionId);
  if (duplicate) {
    throw new Error(
      `Transaction ID "${valid.transactionId}" has already been submitted for this invoice. Please check your reference and try again.`,
    );
  }

  const {data, error} = await supabase
    .from('payment_submissions')
    .insert({
      invoice_id: safeInvoiceId,
      submitted_by: submittedBy,
      method: valid.method as DbPaymentSubmissionMethod,
      sender_number: valid.senderNumber,
      transaction_id: valid.transactionId,
      amount_bdt: valid.amountBdt,
      status: 'Pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as {code?: unknown}).code ?? '')
        : '';
    if (code === '23505') {
      throw new Error(
        `Transaction ID "${valid.transactionId}" has already been submitted for this invoice.`,
      );
    }
    throw new Error(getErrorMessage(error, 'Unable to submit payment proof.'));
  }

  const created = await getById(String(data.id));
  if (!created) {
    throw new Error('Payment submission was saved but could not be reloaded.');
  }
  return created;
}

export async function update(
  id: string,
  input: UpdatePaymentSubmissionInput,
): Promise<PaymentSubmissionRecord> {
  const safeId = assertSafeRecordId(id, 'payment submission');
  const valid = parseServiceInput(updatePaymentSubmissionInputSchema, input);
  const payload: Record<string, unknown> = {};
  if (valid.status !== undefined) payload.status = valid.status as DbPaymentSubmissionStatus;
  if (valid.method !== undefined) payload.method = valid.method as DbPaymentSubmissionMethod;
  if (valid.senderNumber !== undefined) payload.sender_number = valid.senderNumber;
  if (valid.transactionId !== undefined) payload.transaction_id = valid.transactionId;
  if (valid.amountBdt !== undefined) payload.amount_bdt = valid.amountBdt;
  if (valid.rejectionReason !== undefined) {
    payload.rejection_reason = valid.rejectionReason;
  }

  const {error} = await supabase
    .from('payment_submissions')
    .update(payload)
    .eq('id', safeId);

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to update payment submission.'));
  }

  const updated = await getById(safeId);
  if (!updated) {
    throw new Error('Updated payment submission could not be found.');
  }
  return updated;
}

export async function verifyAndMarkInvoicePaid(
  submission: PaymentSubmissionRecord,
): Promise<PaymentSubmissionRecord> {
  const safeId = assertSafeRecordId(submission.id, 'payment submission');
  const {error} = await supabase.rpc('verify_payment_submission', {
    p_submission_id: safeId,
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to verify payment submission.'));
  }

  const updated = await getById(safeId);
  if (!updated) {
    throw new Error('Payment was verified, but the updated record could not be loaded.');
  }
  return updated;
}

export async function rejectSubmission(
  submissionId: string,
  reason: string,
): Promise<PaymentSubmissionRecord> {
  const valid = parseServiceInput(rejectPaymentInputSchema, {submissionId, reason});
  const safeId = assertSafeRecordId(valid.submissionId, 'payment submission');

  const {error} = await supabase.rpc('reject_payment_submission', {
    p_submission_id: safeId,
    p_reason: valid.reason,
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to reject payment submission.'));
  }

  const updated = await getById(safeId);
  if (!updated) {
    throw new Error('Payment was rejected, but the updated record could not be loaded.');
  }
  return updated;
}

export async function remove(id: string): Promise<void> {
  const safeId = assertSafeRecordId(id, 'payment submission');
  const {error} = await supabase.from('payment_submissions').delete().eq('id', safeId);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete payment submission.'));
  }
}
