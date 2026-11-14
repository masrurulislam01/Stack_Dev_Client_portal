import assert from 'node:assert/strict';
import test from 'node:test';
import {
  changePasswordFormSchema,
  clientFormSchema,
  createUpdateInputSchema,
  invoiceFormSchema,
  isSafeAttachmentUrl,
  isSafeInternalLink,
  loginFormSchema,
  paymentSubmissionFormSchema,
  projectFormSchema,
  setNewPasswordFormSchema,
  submitMilestoneReviewInputSchema,
} from '@/types/schemas';
import {escapeCsvCell} from '@/utils/backupExport';
import {
  formatFileSize,
  getFileTypeLabel,
  hasUnsafeFileName,
  sanitizeStorageFileName,
  validateProjectFile,
  validateProjectFileMagicBytes,
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
  assert.equal(hasUnsafeFileName('../secret.pdf'), true);
  assert.equal(hasUnsafeFileName('bad\u202Egpj.png'), true);
  assert.equal(hasUnsafeFileName('valid-design_v1.png'), false);

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

test('validateProjectFileMagicBytes accepts valid PNG/PDF and blocks spoofed HTML payloads', async () => {
  const validPng = new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])],
    'wireframe.png',
    {type: 'image/png'},
  );
  assert.equal((await validateProjectFileMagicBytes(validPng)).valid, true);

  const validPdf = new File(['%PDF-1.7\n1 0 obj\n'], 'invoice.pdf', {type: 'application/pdf'});
  assert.equal((await validateProjectFileMagicBytes(validPdf)).valid, true);

  const spoofedHtmlAsPdf = new File(
    ['<!DOCTYPE html><script>alert(1)</script>'],
    'evil.pdf',
    {type: 'application/pdf'},
  );
  assert.equal((await validateProjectFileMagicBytes(spoofedHtmlAsPdf)).valid, false);

  const spoofedTextAsPng = new File(['plain text masquerading as png'], 'fake.png', {
    type: 'image/png',
  });
  assert.equal((await validateProjectFileMagicBytes(spoofedTextAsPng)).valid, false);
});

test('escapeCsvCell neutralizes spreadsheet formula injection while quoting commas and quotes', () => {
  assert.equal(escapeCsvCell('=CMD("calc")'), `"'=CMD(""calc"")"`);
  assert.equal(escapeCsvCell('+1+1'), "'+1+1");
  assert.equal(escapeCsvCell('-100'), "'-100");
  assert.equal(escapeCsvCell('@SUM(A1:A2)'), "'@SUM(A1:A2)");
  assert.equal(escapeCsvCell('\t=HYPERLINK()'), "'\t=HYPERLINK()");
  assert.equal(escapeCsvCell('Apex Retail, Ltd'), '"Apex Retail, Ltd"');
  assert.equal(escapeCsvCell(null), '');
});

test('attachment URLs and notification links enforce safe schemes and paths', () => {
  assert.equal(isSafeAttachmentUrl('https://example.supabase.co/storage/v1/img.png'), true);
  assert.equal(isSafeAttachmentUrl('data:image/png;base64,iVBORw0KGgo='), true);
  assert.equal(isSafeAttachmentUrl('javascript:alert(1)'), false);
  assert.equal(isSafeAttachmentUrl('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(isSafeAttachmentUrl('http://insecure.example.com/a.png'), false);

  assert.equal(isSafeInternalLink('/projects/proj-1'), true);
  assert.equal(isSafeInternalLink('//evil.com'), false);
  assert.equal(isSafeInternalLink('https://evil.com'), false);
  assert.equal(isSafeInternalLink('/\\evil'), false);

  assert.equal(
    createUpdateInputSchema.safeParse({
      projectId: 'p-1',
      authorId: 'u-1',
      message: 'Preview attached',
      attachments: ['javascript:alert(1)'],
    }).success,
    false,
  );
});

test('Zod form and service schemas validate valid and reject invalid payloads', () => {
  assert.equal(loginFormSchema.safeParse({email: 'bad', password: ''}).success, false);
  assert.equal(
    loginFormSchema.safeParse({email: 'admin@stackdev.com', password: 'secret'}).success,
    true,
  );

  assert.equal(
    setNewPasswordFormSchema.safeParse({newPassword: 'short7', confirmPassword: 'short7'})
      .success,
    false,
  );
  assert.equal(
    setNewPasswordFormSchema.safeParse({
      newPassword: 'strongPass8',
      confirmPassword: 'strongPass8',
    }).success,
    true,
  );
  assert.equal(
    changePasswordFormSchema.safeParse({
      currentPassword: 'oldPassword1',
      newPassword: '1234567',
      confirmPassword: '1234567',
    }).success,
    false,
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
