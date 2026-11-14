import type {InvoiceRecord, InvoiceStatus} from '@/types/portal';

export {AGENCY_ADDRESS, AGENCY_NAME, AGENCY_PHONE} from '@/lib/constants';

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
