import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clientFormSchema,
  invoiceFormSchema,
  loginFormSchema,
  paymentSubmissionFormSchema,
  projectFormSchema,
  submitMilestoneReviewInputSchema,
} from '@/types/schemas';
import {
  formatFileSize,
  getFileTypeLabel,
  sanitizeStorageFileName,
  validateProjectFile,
} from '@/utils/fileSharing';
import {formatBDT, formatDateDisplay, formatPdfBDT} from '@/utils/format';
import {
  generateNextInvoiceNumber,
  getEffectiveInvoiceStatus,
  mapInvoiceDoc,
} from '@/utils/invoices';

test('BDT currency formatters format integers and edge cases cleanly', () => {
  assert.equal(formatBDT(0), '৳0');
  assert.equal(formatBDT(85000), '৳85,000');
  assert.equal(formatBDT(Number.NaN), '৳0');
  assert.equal(formatPdfBDT(85000), 'BDT 85,000');
  assert.equal(formatDateDisplay(''), '—');
});

test('getEffectiveInvoiceStatus resolves Overdue vs Sent vs Paid vs Draft', () => {
  assert.equal(getEffectiveInvoiceStatus({status: 'Paid', dueDate: '2020-01-01'}), 'Paid');
  assert.equal(getEffectiveInvoiceStatus({status: 'Draft', dueDate: '2020-01-01'}), 'Draft');
  assert.equal(getEffectiveInvoiceStatus({status: 'Sent', dueDate: '2020-01-01'}), 'Overdue');
  assert.equal(getEffectiveInvoiceStatus({status: 'Sent', dueDate: '2099-12-31'}), 'Sent');
});

test('generateNextInvoiceNumber increments max sequence for the given year', () => {
  assert.equal(generateNextInvoiceNumber([], 2026), 'SD-2026-0001');
  assert.equal(
    generateNextInvoiceNumber(['SD-2026-0004', 'SD-2025-0099', 'SD-2026-0012'], 2026),
    'SD-2026-0013',
  );
});

test('mapInvoiceDoc normalizes status and computes line item totals', () => {
  const mapped = mapInvoiceDoc('inv-1', {
    invoiceNumber: 'SD-2026-0007',
    status: 'paid',
    amount: 45000,
    lineItems: [{description: 'UI Design', quantity: 2, unitPrice: 15000}],
  });
  assert.equal(mapped.status, 'Paid');
  assert.equal(mapped.invoiceNumber, 'SD-2026-0007');
  assert.equal(mapped.lineItems.length, 1);
  assert.equal(mapped.lineItems[0].total, 30000);
});

test('file sharing utilities format sizes, labels, sanitize names, and validate files', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(1536), '1.5 KB');
  assert.equal(formatFileSize(2 * 1024 * 1024), '2.00 MB');
  assert.equal(getFileTypeLabel('pdf'), 'PDF Document');
  assert.equal(sanitizeStorageFileName('  my design (final).png  '), 'my_design_final_.png');

  const emptyFile = new File([], 'empty.pdf', {type: 'application/pdf'});
  const emptyRes = validateProjectFile(emptyFile);
  assert.equal(emptyRes.valid, false);

  const svgFile = new File(['<svg/>'], 'icon.svg', {type: 'image/svg+xml'});
  const svgRes = validateProjectFile(svgFile);
  assert.equal(svgRes.valid, false);

  const okFile = new File(['hello'], 'brief.pdf', {type: 'application/pdf'});
  const okRes = validateProjectFile(okFile);
  assert.equal(okRes.valid, true);
  if (okRes.valid) {
    assert.equal(okRes.extension, 'pdf');
    assert.equal(okRes.resolvedMimeType, 'application/pdf');
  }
});

test('Zod form and service schemas validate valid and reject invalid payloads', () => {
  assert.equal(loginFormSchema.safeParse({email: 'bad', password: ''}).success, false);
  assert.equal(
    loginFormSchema.safeParse({email: 'admin@stackdev.com', password: 'secret'}).success,
    true,
  );

  assert.equal(
    clientFormSchema.safeParse({contactName: '', email: 'not-an-email'}).success,
    false,
  );
  assert.equal(
    clientFormSchema.safeParse({
      companyName: 'Padma Fresh',
      contactName: 'Tariqul Islam',
      email: 'tariqul@padmafresh.bd',
    }).success,
    true,
  );

  assert.equal(
    projectFormSchema.safeParse({
      title: 'App',
      clientId: 'c-1',
      package: 'premium',
      status: 'Design',
      progress: 40,
      startDate: '2026-05-10',
      dueDate: '2026-05-01',
      revisionsAllowed: 5,
      revisionsUsed: 1,
    }).success,
    false,
  );

  assert.equal(
    invoiceFormSchema.safeParse({
      clientId: 'c-1',
      projectId: 'p-1',
      issueDate: '2026-05-01',
      dueDate: '2026-05-15',
      status: 'Sent',
      lineItems: [{description: 'Milestone 1', quantity: 1, unitPrice: 50000}],
    }).success,
    true,
  );

  assert.equal(
    paymentSubmissionFormSchema.safeParse({
      method: 'bKash',
      senderNumber: '017',
      transactionId: '12',
      amountBdt: 0,
    }).success,
    false,
  );

  assert.equal(
    submitMilestoneReviewInputSchema.safeParse({
      id: 'm-1',
      decision: 'Changes Requested',
      feedback: '   ',
    }).success,
    false,
  );
  assert.equal(
    submitMilestoneReviewInputSchema.safeParse({
      id: 'm-1',
      decision: 'Approved',
      feedback: '',
    }).success,
    true,
  );
});
