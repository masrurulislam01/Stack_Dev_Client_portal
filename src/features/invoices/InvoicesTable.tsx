import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge, TableContainer, TableHead, TableHeaderCell} from '@/components/ui';
import {
  INVOICE_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_DOT_CLASSES,
} from '@/config/constants';
import type {TranslationDictionary} from '@/i18n/translations';
import type {InvoiceRecord} from '@/types/portal';
import {formatBDT, formatDateDisplay} from '@/utils/format';
import {downloadInvoicePdf} from '@/utils/invoicePdf';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

interface InvoicesTableProps {
  invoices: InvoiceRecord[];
  isAdmin: boolean;
  pendingInvoiceIds: Set<string>;
  deletingId: string | null;
  t: TranslationDictionary;
  onEdit: (invoice: InvoiceRecord) => void;
  onMarkPaid: (invoice: InvoiceRecord) => void;
  onRequestDelete: (invoice: InvoiceRecord) => void;
}

export function InvoicesTable({
  invoices,
  isAdmin,
  pendingInvoiceIds,
  deletingId,
  t,
  onEdit,
  onMarkPaid,
  onRequestDelete,
}: InvoicesTableProps) {
  return (
    <TableContainer className="hidden md:block border-0 rounded-none shadow-none">
      <TableHead>
        <TableHeaderCell className="px-6">Invoice #</TableHeaderCell>
        {isAdmin && <TableHeaderCell>Client</TableHeaderCell>}
        <TableHeaderCell>Project</TableHeaderCell>
        <TableHeaderCell align="right">Amount</TableHeaderCell>
        <TableHeaderCell>Due Date</TableHeaderCell>
        <TableHeaderCell>Status</TableHeaderCell>
        <TableHeaderCell align="right" className="px-6">
          Actions
        </TableHeaderCell>
      </TableHead>
      <tbody className="divide-y divide-border text-sm">
        {invoices.map((inv) => {
          const invoiceNumber = inv.invoiceNumber || 'Invoice';
          const clientName = inv.clientName || 'Client';
          const projectTitle = inv.projectTitle || '—';
          const amount = Number.isFinite(inv.amount) ? inv.amount : 0;
          const effectiveStatus = getEffectiveInvoiceStatus(inv);
          const hasPendingReview = effectiveStatus !== 'Paid' && pendingInvoiceIds.has(inv.id);
          const isDeleting = deletingId === inv.id;

          return (
            <tr key={inv.id} className="h-[56px] hover:bg-surface-muted/60 transition-colors">
              <td className="py-3.5 px-6 font-mono font-semibold whitespace-nowrap num">
                <Link
                  to={`/invoices/${inv.id}`}
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  {invoiceNumber}
                </Link>
              </td>
              {isAdmin && (
                <td className="py-3.5 px-4 font-medium text-foreground">{clientName}</td>
              )}
              <td className="py-3.5 px-4 text-body">{projectTitle}</td>
              <td className="py-3.5 px-4 text-right font-semibold text-foreground num whitespace-nowrap">
                {formatBDT(amount)}
              </td>
              <td
                className={`py-3.5 px-4 num whitespace-nowrap ${
                  effectiveStatus === 'Overdue' ? 'text-danger-text font-semibold' : 'text-body'
                }`}
              >
                {formatDateDisplay(inv.dueDate)}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    dot
                    dotClassName={INVOICE_STATUS_DOT_CLASSES[effectiveStatus]}
                    className={INVOICE_STATUS_BADGE_CLASSES[effectiveStatus]}
                  >
                    {effectiveStatus}
                  </Badge>
                  {hasPendingReview && (
                    <Badge tone="warning">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      Payment under review
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-3.5 px-6 text-right whitespace-nowrap">
                <div className="inline-flex items-center gap-1">
                  <Link
                    to={`/invoices/${inv.id}`}
                    title="View / Print Invoice"
                    aria-label={`View ${invoiceNumber}`}
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => downloadInvoicePdf(inv)}
                    title={t.actions.downloadPdf}
                    aria-label={`Download PDF for ${invoiceNumber}`}
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                  </button>
                  {!isAdmin && effectiveStatus !== 'Paid' && amount > 0 && (
                    <Link
                      to={`/invoices/${inv.id}#pay-now`}
                      className="ml-1 inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-semibold hover:brightness-110 transition-all whitespace-nowrap"
                    >
                      <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{hasPendingReview ? 'Reviewing' : t.actions.payOnline}</span>
                    </Link>
                  )}
                  {isAdmin && effectiveStatus !== 'Paid' && (
                    <button
                      type="button"
                      onClick={() => onMarkPaid(inv)}
                      title={t.actions.markPaid}
                      className="ml-1 inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-success hover:brightness-110 text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.actions.markPaid}</span>
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(inv)}
                        aria-label={`Edit ${invoiceNumber}`}
                        className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onRequestDelete(inv)}
                        aria-label={`Delete ${invoiceNumber}`}
                        className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-danger-text hover:bg-danger-soft disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableContainer>
  );
}
