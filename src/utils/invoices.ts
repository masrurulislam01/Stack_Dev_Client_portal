import {AGENCY_INFO, type InvoiceStatus} from '@/config/constants';
import type {InvoiceLineItem, InvoiceRecord} from '@/types/portal';

export const AGENCY_NAME = AGENCY_INFO.name;
export const AGENCY_ADDRESS = AGENCY_INFO.address;
export const AGENCY_PHONE = AGENCY_INFO.phone;

export function getTodayIsoDate(): string {
  return new Date().toLocaleDateString('en-CA');
}

export function getEffectiveInvoiceStatus(
  invoice: Pick<InvoiceRecord, 'status' | 'dueDate'>,
): InvoiceStatus {
  if (invoice.status === 'Paid') return 'Paid';
  if (invoice.status === 'Draft') return 'Draft';
  const today = getTodayIsoDate();
  if (invoice.dueDate && invoice.dueDate < today) {
    return 'Overdue';
  }
  return invoice.status === 'Overdue' ? 'Overdue' : 'Sent';
}

export function generateNextInvoiceNumber(
  existingInvoiceNumbers: string[],
  year = new Date().getFullYear(),
): string {
  const prefix = `SD-${year}-`;
  let maxSeq = 0;

  for (const num of existingInvoiceNumbers) {
    if (num.startsWith(prefix)) {
      const suffix = num.slice(prefix.length);
      const parsed = Number.parseInt(suffix, 10);
      if (Number.isFinite(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

export function mapInvoiceDoc(id: string, data: Record<string, unknown>): InvoiceRecord {
  const rawStatus = String(data.status ?? 'Sent');
  const status: InvoiceStatus =
    rawStatus === 'Draft' ||
    rawStatus === 'Sent' ||
    rawStatus === 'Paid' ||
    rawStatus === 'Overdue'
      ? rawStatus
      : rawStatus.toLowerCase() === 'paid'
        ? 'Paid'
        : rawStatus.toLowerCase() === 'overdue'
          ? 'Overdue'
          : rawStatus.toLowerCase() === 'draft'
            ? 'Draft'
            : 'Sent';

  const rawItems = Array.isArray(data.lineItems) ? data.lineItems : [];
  const lineItems: InvoiceLineItem[] = rawItems
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

  const paymentMethod = String(data.paymentMethod ?? '').trim().slice(0, 120);

  return {
    id,
    clientId: String(data.clientId ?? ''),
    visibleToClientId: String(data.visibleToClientId ?? ''),
    clientName: String(data.clientName ?? ''),
    clientEmail: String(data.clientEmail ?? ''),
    projectId: String(data.projectId ?? ''),
    projectTitle: String(data.projectTitle ?? ''),
    invoiceNumber: String(data.invoiceNumber ?? id),
    lineItems,
    amount: Number(data.amount ?? 0),
    issueDate: String(data.issueDate ?? ''),
    dueDate: String(data.dueDate ?? ''),
    notes: String(data.notes ?? ''),
    status,
    paymentMethod,
    paymentReference: String(data.paymentReference ?? ''),
    paidAt: data.paidAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
