import {INVOICE_STATUSES, type InvoiceStatus} from '@/config/constants';
import {supabase} from '@/lib/supabase';
import {assertSafeRecordId, getErrorMessage, parseServiceInput} from '@/services/serviceUtils';
import type {DbInvoiceLineItem, DbInvoiceStatus, InvoiceRow} from '@/types/database';
import type {InvoiceLineItem, InvoiceRecord} from '@/types/portal';
import {
  createInvoiceInputSchema,
  markInvoicePaidInputSchema,
  updateInvoiceInputSchema,
} from '@/types/schemas';

interface InvoiceJoinedRow extends InvoiceRow {
  clients?: {company_name?: string | null; email?: string | null} | null;
  projects?: {title?: string | null} | null;
}

export interface ListInvoicesOptions {
  clientId?: string;
  projectId?: string;
  includeDrafts?: boolean;
}

export interface CreateInvoiceInput {
  clientId: string;
  projectId: string;
  lineItems: InvoiceLineItem[];
  totalBdt: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
  status: InvoiceStatus;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
}

export interface UpdateInvoiceInput {
  clientId?: string;
  projectId?: string;
  lineItems?: InvoiceLineItem[];
  totalBdt?: number;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  status?: InvoiceStatus;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
}

function normalizeItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const quantity = Number(obj.quantity ?? 1);
      const unitPrice = Number(obj.unitPrice ?? 0);
      const total = Number(obj.total ?? quantity * unitPrice);
      return {
        description: String(obj.description ?? ''),
        quantity,
        unitPrice,
        total,
      };
    })
    .filter((item): item is InvoiceLineItem => item !== null);
}

function mapInvoiceRow(row: InvoiceJoinedRow): InvoiceRecord {
  const status: InvoiceStatus = INVOICE_STATUSES.includes(row.status) ? row.status : 'Sent';

  return {
    id: String(row.id),
    clientId: String(row.client_id ?? ''),
    visibleToClientId: status === 'Draft' ? '' : String(row.client_id ?? ''),
    clientName: String(row.clients?.company_name ?? ''),
    clientEmail: String(row.clients?.email ?? ''),
    projectId: String(row.project_id ?? ''),
    projectTitle: String(row.projects?.title ?? ''),
    invoiceNumber: String(row.invoice_number ?? row.id),
    lineItems: normalizeItems(row.items),
    amount: Number(row.total_bdt ?? 0),
    issueDate: String(row.issue_date ?? ''),
    dueDate: String(row.due_date ?? ''),
    notes: String(row.notes ?? ''),
    status,
    paymentMethod: String(row.payment_method ?? '').trim(),
    paymentReference: String(row.payment_reference ?? '').trim(),
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at,
  };
}

const INVOICE_SELECT =
  'id, client_id, project_id, invoice_number, items, total_bdt, issue_date, due_date, notes, status, paid_at, payment_method, payment_reference, created_at, clients(company_name, email), projects(title)';

export async function list(options: ListInvoicesOptions = {}): Promise<InvoiceRecord[]> {
  let query = supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .order('created_at', {ascending: false});

  if (options.clientId) {
    query = query.eq('client_id', options.clientId);
  }
  if (options.projectId) {
    query = query.eq('project_id', options.projectId);
  }
  if (options.includeDrafts !== true) {
    query = query.neq('status', 'Draft');
  }

  const {data, error} = await query;
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load invoices.'));
  }

  return ((data ?? []) as unknown as InvoiceJoinedRow[]).map(mapInvoiceRow);
}

export async function getById(id: string): Promise<InvoiceRecord | null> {
  const safeId = assertSafeRecordId(id, 'invoice');
  const {data, error} = await supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('id', safeId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load invoice details.'));
  }
  if (!data) return null;

  return mapInvoiceRow(data as unknown as InvoiceJoinedRow);
}

export async function create(input: CreateInvoiceInput): Promise<InvoiceRecord> {
  const valid = parseServiceInput(createInvoiceInputSchema, input);
  const items: DbInvoiceLineItem[] = valid.lineItems.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    total: Math.round(li.quantity * li.unitPrice),
  }));

  const {data, error} = await supabase
    .from('invoices')
    .insert({
      client_id: valid.clientId,
      project_id: valid.projectId,
      items,
      total_bdt: valid.totalBdt,
      issue_date: valid.issueDate,
      due_date: valid.dueDate,
      notes: valid.notes,
      status: valid.status as DbInvoiceStatus,
      payment_method:
        valid.status === 'Paid' ? valid.paymentMethod || 'Cash' : valid.paymentMethod ?? null,
      payment_reference: valid.status === 'Paid' ? valid.paymentReference ?? '' : null,
      paid_at: valid.status === 'Paid' ? valid.paidAt ?? new Date().toISOString() : null,
    })
    .select(INVOICE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to create invoice.'));
  }

  return mapInvoiceRow(data as unknown as InvoiceJoinedRow);
}

export async function update(id: string, input: UpdateInvoiceInput): Promise<InvoiceRecord> {
  const valid = parseServiceInput(updateInvoiceInputSchema, input);
  const payload: Record<string, unknown> = {};
  if (valid.clientId !== undefined) payload.client_id = valid.clientId;
  if (valid.projectId !== undefined) payload.project_id = valid.projectId;
  if (valid.lineItems !== undefined) {
    payload.items = valid.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      total: Math.round(li.quantity * li.unitPrice),
    }));
  }
  if (valid.totalBdt !== undefined) payload.total_bdt = valid.totalBdt;
  if (valid.issueDate !== undefined) payload.issue_date = valid.issueDate;
  if (valid.dueDate !== undefined) payload.due_date = valid.dueDate;
  if (valid.notes !== undefined) payload.notes = valid.notes;
  if (valid.status !== undefined) payload.status = valid.status;
  if (valid.paymentMethod !== undefined) payload.payment_method = valid.paymentMethod;
  if (valid.paymentReference !== undefined) payload.payment_reference = valid.paymentReference;
  if (valid.paidAt !== undefined) payload.paid_at = valid.paidAt;

  const safeId = assertSafeRecordId(id, 'invoice');
  const {data, error} = await supabase
    .from('invoices')
    .update(payload)
    .eq('id', safeId)
    .select(INVOICE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to update invoice.'));
  }

  return mapInvoiceRow(data as unknown as InvoiceJoinedRow);
}

export async function markPaid(
  id: string,
  paymentMethod: string,
  paymentReference = '',
): Promise<InvoiceRecord> {
  const valid = parseServiceInput(markInvoicePaidInputSchema, {
    id,
    paymentMethod,
    paymentReference,
  });

  return update(valid.id, {
    status: 'Paid',
    paymentMethod: valid.paymentMethod,
    paymentReference: valid.paymentReference,
    paidAt: new Date().toISOString(),
  });
}

export async function remove(id: string): Promise<void> {
  const safeId = assertSafeRecordId(id, 'invoice');
  const {error} = await supabase.from('invoices').delete().eq('id', safeId);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete invoice.'));
  }
}
