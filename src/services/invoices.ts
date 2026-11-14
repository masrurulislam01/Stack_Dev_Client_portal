import {INVOICE_STATUSES} from '@/lib/constants';
import {supabase} from '@/lib/supabase';
import {getErrorMessage, parseApiInput} from '@/services/serviceUtils';
import type {DbInvoiceLineItem, DbInvoiceStatus, InvoiceRow} from '@/types/database';
import {
  createInvoiceApiSchema,
  updateInvoiceApiSchema,
  type InvoiceLineItem,
  type InvoiceRecord,
  type InvoiceStatus,
} from '@/types/portal';

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
  if (options.includeDrafts === false) {
    query = query.neq('status', 'Draft');
  }

  const {data, error} = await query;
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load invoices.'));
  }

  return ((data ?? []) as unknown as InvoiceJoinedRow[]).map(mapInvoiceRow);
}

export async function getById(id: string): Promise<InvoiceRecord | null> {
  const {data, error} = await supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load invoice details.'));
  }
  if (!data) return null;

  return mapInvoiceRow(data as unknown as InvoiceJoinedRow);
}

export async function create(input: CreateInvoiceInput): Promise<InvoiceRecord> {
  const validated = parseApiInput(createInvoiceApiSchema, input);

  const items: DbInvoiceLineItem[] = validated.lineItems.map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    total: Math.round(li.quantity * li.unitPrice),
  }));

  const {data, error} = await supabase
    .from('invoices')
    .insert({
      client_id: validated.clientId,
      project_id: validated.projectId,
      items,
      total_bdt: validated.totalBdt,
      issue_date: validated.issueDate,
      due_date: validated.dueDate,
      notes: validated.notes ?? '',
      status: validated.status as DbInvoiceStatus,
      payment_method:
        validated.status === 'Paid'
          ? validated.paymentMethod || 'Cash'
          : validated.paymentMethod ?? null,
      payment_reference:
        validated.status === 'Paid' ? validated.paymentReference ?? '' : null,
      paid_at:
        validated.status === 'Paid'
          ? validated.paidAt ?? new Date().toISOString()
          : null,
    })
    .select(INVOICE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to create invoice.'));
  }

  return mapInvoiceRow(data as unknown as InvoiceJoinedRow);
}

export async function update(id: string, input: UpdateInvoiceInput): Promise<InvoiceRecord> {
  const validated = parseApiInput(updateInvoiceApiSchema, input);
  const payload: Record<string, unknown> = {};
  if (validated.clientId !== undefined) payload.client_id = validated.clientId;
  if (validated.projectId !== undefined) payload.project_id = validated.projectId;
  if (validated.lineItems !== undefined) {
    payload.items = validated.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      total: Math.round(li.quantity * li.unitPrice),
    }));
  }
  if (validated.totalBdt !== undefined) payload.total_bdt = validated.totalBdt;
  if (validated.issueDate !== undefined) payload.issue_date = validated.issueDate;
  if (validated.dueDate !== undefined) payload.due_date = validated.dueDate;
  if (validated.notes !== undefined) payload.notes = validated.notes;
  if (validated.status !== undefined) payload.status = validated.status;
  if (validated.paymentMethod !== undefined) payload.payment_method = validated.paymentMethod;
  if (validated.paymentReference !== undefined) {
    payload.payment_reference = validated.paymentReference;
  }
  if (validated.paidAt !== undefined) payload.paid_at = validated.paidAt;

  const {data, error} = await supabase
    .from('invoices')
    .update(payload)
    .eq('id', id)
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
  return update(id, {
    status: 'Paid',
    paymentMethod,
    paymentReference: paymentReference.trim(),
    paidAt: new Date().toISOString(),
  });
}

export async function remove(id: string): Promise<void> {
  const {error} = await supabase.from('invoices').delete().eq('id', id);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete invoice.'));
  }
}
