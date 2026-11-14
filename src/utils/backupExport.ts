import {list as listClients} from '@/services/clients';
import {list as listInvoices} from '@/services/invoices';
import {list as listPaymentSubmissions} from '@/services/payments';
import {list as listProjects} from '@/services/projects';
import type {
  ClientRecord,
  InvoiceRecord,
  PaymentSubmissionRecord,
  ProjectRecord,
} from '@/types/portal';

export interface BackupSnapshot {
  exportedAt: string;
  exportedBy: string;
  counts: {
    clients: number;
    projects: number;
    invoices: number;
    paymentSubmissions: number;
  };
  data: {
    clients: ClientRecord[];
    projects: ProjectRecord[];
    invoices: InvoiceRecord[];
    paymentSubmissions: PaymentSubmissionRecord[];
  };
}

function getDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function triggerBlobDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const FORMULA_PREFIX_REGEX = /^[\s]*[=+\-@\t\r]/;

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (FORMULA_PREFIX_REGEX.test(str)) {
    str = `'${str}`;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv<T extends object>(
  headers: {key: keyof T; label: string}[],
  rows: T[],
): string {
  const headerLine = headers.map((h) => escapeCsvCell(h.label)).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvCell(row[h.key])).join(','),
  );
  // Prepend UTF-8 BOM so Excel/Sheets renders Bangla text and ৳ correctly
  return `\uFEFF${[headerLine, ...dataLines].join('\r\n')}`;
}

export async function fetchBackupSnapshot(exportedBy: string): Promise<BackupSnapshot> {
  const [clients, projects, invoices, paymentSubmissions] = await Promise.all([
    listClients(),
    listProjects(),
    listInvoices({includeDrafts: true}),
    listPaymentSubmissions(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    exportedBy,
    counts: {
      clients: clients.length,
      projects: projects.length,
      invoices: invoices.length,
      paymentSubmissions: paymentSubmissions.length,
    },
    data: {
      clients,
      projects,
      invoices,
      paymentSubmissions,
    },
  };
}

export function downloadJsonBackup(snapshot: BackupSnapshot): string {
  const filename = `stackdev-backup-${getDateStamp()}.json`;
  triggerBlobDownload(
    filename,
    JSON.stringify(snapshot, null, 2),
    'application/json;charset=utf-8',
  );
  return filename;
}

export async function downloadCsvBackups(snapshot: BackupSnapshot): Promise<string[]> {
  const stamp = getDateStamp();

  const files: {filename: string; content: string}[] = [
    {
      filename: `stackdev-clients-${stamp}.csv`,
      content: toCsv(
        [
          {key: 'id', label: 'ID'},
          {key: 'companyName', label: 'Company Name'},
          {key: 'contactName', label: 'Contact Name'},
          {key: 'email', label: 'Email'},
          {key: 'phone', label: 'Phone'},
          {key: 'hasLoginAccount', label: 'Has Login Account'},
          {key: 'notes', label: 'Notes'},
          {key: 'createdAt', label: 'Created At'},
        ],
        snapshot.data.clients,
      ),
    },
    {
      filename: `stackdev-projects-${stamp}.csv`,
      content: toCsv(
        [
          {key: 'id', label: 'ID'},
          {key: 'title', label: 'Title'},
          {key: 'clientId', label: 'Client ID'},
          {key: 'clientName', label: 'Client Name'},
          {key: 'package', label: 'Package'},
          {key: 'status', label: 'Status'},
          {key: 'progress', label: 'Progress (%)'},
          {key: 'startDate', label: 'Start Date'},
          {key: 'dueDate', label: 'Due Date'},
          {key: 'revisionsAllowed', label: 'Revisions Allowed'},
          {key: 'revisionsUsed', label: 'Revisions Used'},
          {key: 'description', label: 'Description'},
          {key: 'createdAt', label: 'Created At'},
        ],
        snapshot.data.projects,
      ),
    },
    {
      filename: `stackdev-invoices-${stamp}.csv`,
      content: toCsv(
        [
          {key: 'id', label: 'ID'},
          {key: 'invoiceNumber', label: 'Invoice Number'},
          {key: 'clientId', label: 'Client ID'},
          {key: 'clientName', label: 'Client Name'},
          {key: 'clientEmail', label: 'Client Email'},
          {key: 'projectId', label: 'Project ID'},
          {key: 'projectTitle', label: 'Project Title'},
          {key: 'amount', label: 'Total (BDT)'},
          {key: 'status', label: 'Status'},
          {key: 'issueDate', label: 'Issue Date'},
          {key: 'dueDate', label: 'Due Date'},
          {key: 'paidAt', label: 'Paid At'},
          {key: 'paymentMethod', label: 'Payment Method'},
          {key: 'paymentReference', label: 'Payment Reference'},
          {key: 'lineItems', label: 'Line Items (JSON)'},
          {key: 'notes', label: 'Notes'},
          {key: 'createdAt', label: 'Created At'},
        ],
        snapshot.data.invoices,
      ),
    },
    {
      filename: `stackdev-payments-${stamp}.csv`,
      content: toCsv(
        [
          {key: 'id', label: 'ID'},
          {key: 'invoiceId', label: 'Invoice ID'},
          {key: 'invoiceNumber', label: 'Invoice Number'},
          {key: 'invoiceStatus', label: 'Invoice Status'},
          {key: 'clientId', label: 'Client ID'},
          {key: 'clientName', label: 'Client Name'},
          {key: 'projectTitle', label: 'Project Title'},
          {key: 'method', label: 'Method'},
          {key: 'senderNumber', label: 'Sender Number'},
          {key: 'transactionId', label: 'Transaction ID'},
          {key: 'amountBdt', label: 'Amount (BDT)'},
          {key: 'status', label: 'Submission Status'},
          {key: 'rejectionReason', label: 'Rejection Reason'},
          {key: 'verifiedBy', label: 'Verified By'},
          {key: 'verifiedAt', label: 'Verified At'},
          {key: 'createdAt', label: 'Submitted At'},
        ],
        snapshot.data.paymentSubmissions,
      ),
    },
  ];

  // Stagger sequential downloads slightly so browsers do not drop multiple files
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    triggerBlobDownload(file.filename, file.content, 'text/csv;charset=utf-8');
    if (i < files.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }
  }

  return files.map((f) => f.filename);
}
