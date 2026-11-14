import {jsPDF} from 'jspdf';
import type {InvoiceRecord} from '../types/portal';
import {formatDateDisplay, formatDateTime} from './format';
import {
  AGENCY_ADDRESS,
  AGENCY_NAME,
  AGENCY_PHONE,
  getEffectiveInvoiceStatus,
} from './invoices';

function formatPdfBDT(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `BDT ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(safe)}`;
}

export function downloadInvoicePdf(invoice: InvoiceRecord): void {
  const doc = new jsPDF({unit: 'pt', format: 'a4'});
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;

  const effectiveStatus = getEffectiveInvoiceStatus(invoice);

  // Top Indigo Accent Bar
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 8, 'F');

  let y = 48;

  // Agency Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(67, 56, 202);
  doc.text(AGENCY_NAME, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(AGENCY_ADDRESS, margin, y + 18);
  doc.text(`Phone: ${AGENCY_PHONE}`, margin, y + 33);

  // Invoice Title & Number (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('INVOICE', pageWidth - margin, y, {align: 'right'});

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(invoice.invoiceNumber, pageWidth - margin, y + 18, {align: 'right'});

  const statusColor: [number, number, number] =
    effectiveStatus === 'Paid'
      ? [5, 150, 105]
      : effectiveStatus === 'Overdue'
        ? [220, 38, 38]
        : effectiveStatus === 'Sent'
          ? [217, 119, 6]
          : [100, 116, 139];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...statusColor);
  doc.text(`STATUS: ${effectiveStatus.toUpperCase()}`, pageWidth - margin, y + 34, {
    align: 'right',
  });

  y += 60;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  y += 24;

  // Bill To & Dates Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('BILL TO', margin, y);
  doc.text('INVOICE DETAILS', pageWidth - margin - 180, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.clientName || 'Client', margin, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  let billY = y + 31;
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, margin, billY);
    billY += 15;
  }
  if (invoice.projectTitle) {
    doc.text(`Project: ${invoice.projectTitle}`, margin, billY);
    billY += 15;
  }

  const metaX = pageWidth - margin - 180;
  doc.text(`Issue Date: ${formatDateDisplay(invoice.issueDate)}`, metaX, y + 16);
  doc.text(`Due Date: ${formatDateDisplay(invoice.dueDate)}`, metaX, y + 31);
  doc.text(`Currency: BDT`, metaX, y + 46);

  y = Math.max(billY, y + 60) + 18;

  // Line Items Table Header
  const colDescX = margin + 10;
  const colQtyX = margin + contentWidth - 195;
  const colUnitX = margin + contentWidth - 110;
  const colTotalX = pageWidth - margin - 10;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  doc.line(margin, y + 26, pageWidth - margin, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', colDescX, y + 17);
  doc.text('QTY', colQtyX, y + 17, {align: 'right'});
  doc.text('UNIT PRICE', colUnitX, y + 17, {align: 'right'});
  doc.text('TOTAL', colTotalX, y + 17, {align: 'right'});

  y += 26;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  for (const item of invoice.lineItems) {
    const descLines = doc.splitTextToSize(item.description || 'Item', contentWidth - 235) as string[];
    const rowHeight = Math.max(28, descLines.length * 14 + 14);

    if (y + rowHeight > pageHeight - 120) {
      doc.addPage();
      y = 48;
    }

    doc.setTextColor(15, 23, 42);
    doc.text(descLines, colDescX, y + 17);
    doc.setTextColor(51, 65, 85);
    doc.text(String(item.quantity), colQtyX, y + 17, {align: 'right'});
    doc.text(formatPdfBDT(item.unitPrice), colUnitX, y + 17, {align: 'right'});
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatPdfBDT(item.total), colTotalX, y + 17, {align: 'right'});
    doc.setFont('helvetica', 'normal');

    y += rowHeight;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, pageWidth - margin, y);
  }

  // Total Box
  y += 18;
  if (y + 90 > pageHeight - 60) {
    doc.addPage();
    y = 48;
  }

  doc.setFillColor(238, 242, 255);
  doc.roundedRect(pageWidth - margin - 220, y, 220, 42, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(67, 56, 202);
  doc.text('TOTAL DUE', pageWidth - margin - 206, y + 25);
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(formatPdfBDT(invoice.amount), pageWidth - margin - 14, y + 26, {align: 'right'});

  y += 64;

  // Payment Record (if Paid)
  if (effectiveStatus === 'Paid' && invoice.paymentMethod) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin, y, contentWidth, 54, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(4, 120, 87);
    doc.text('PAYMENT RECEIVED', margin + 12, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const paidLine = `Method: ${invoice.paymentMethod}${
      invoice.paidAt ? ` · Paid on ${formatDateTime(invoice.paidAt)}` : ''
    }`;
    doc.text(paidLine, margin + 12, y + 34);
    if (invoice.paymentReference) {
      doc.setTextColor(71, 85, 105);
      doc.text(`Reference: ${invoice.paymentReference}`, margin + 12, y + 48);
    }
    y += 72;
  }

  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('NOTES', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth) as string[];
    doc.text(noteLines, margin, y + 15);
  }

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 48, pageWidth - margin, pageHeight - 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${AGENCY_ADDRESS} · ${AGENCY_PHONE} · Thank you for building with Stack Dev.`,
    pageWidth / 2,
    pageHeight - 30,
    {align: 'center'},
  );

  doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
}
