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
import {Badge, Button} from '@/components/ui';
import {
  INVOICE_STATUS_BADGE_CLASSES,
  INVOICE_STATUS_DOT_CLASSES,
} from '@/config/constants';
import type {TranslationDictionary} from '@/i18n/translations';
import type {InvoiceRecord} from '@/types/portal';
import {formatBDT, formatDateDisplay} from '@/utils/format';
import {downloadInvoicePdf} from '@/utils/invoicePdf';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

interface InvoicesMobileListProps {
  invoices: InvoiceRecord[];
  isAdmin: boolean;
  pendingInvoiceIds: Set<string>;
  deletingId: string | null;
  t: TranslationDictionary;
  onMarkPaid: (invoice: InvoiceRecord) => void;
  onEdit: (invoice: InvoiceRecord) => void;
  onRequestDelete: (invoice: InvoiceRecord) => void;
}

export function InvoicesMobileList({
  invoices,
  isAdmin,
  pendingInvoiceIds,
  deletingId,
  t,
  onMarkPaid,
  onEdit,
  onRequestDelete,
}: InvoicesMobileListProps) {
  return (
    <ul className="md:hidden divide-y divide-border">
      {invoices.map((inv) => {
        const invoiceNumber = inv.invoiceNumber || 'Invoice';
        const clientName = inv.clientName || 'Client';
        const projectTitle = inv.projectTitle || '—';
        const amount = Number.isFinite(inv.amount) ? inv.amount : 0;
        const effectiveStatus = getEffectiveInvoiceStatus(inv);
        const hasPendingReview =
          effectiveStatus !== 'Paid' && pendingInvoiceIds.has(inv.id);
        const isDeleting = deletingId === inv.id;

        return (
          <li key={inv.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/invoices/${inv.id}`}
                  className="font-mono text-sm font-semibold text-primary-600 hover:underline num"
                >
                  {invoiceNumber}
                </Link>
                <p className="text-xs text-muted mt-0.5">
                  {isAdmin ? `${clientName} · ` : ''}
                  {projectTitle}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-heading font-bold text-foreground num">
                {formatBDT(amount)}
              </span>
              <span
                className={`text-xs num ${
                  effectiveStatus === 'Overdue' ? 'text-danger-text font-semibold' : 'text-muted'
                }`}
              >
                Due {formatDateDisplay(inv.dueDate)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/invoices/${inv.id}`}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-border-strong bg-surface text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.actions.view}</span>
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => downloadInvoicePdf(inv)}
                icon={<Download className="w-3.5 h-3.5" aria-hidden="true" />}
              >
                {t.actions.downloadPdf}
              </Button>
              {!isAdmin && effectiveStatus !== 'Paid' && amount > 0 && (
                <Link
                  to={`/invoices/${inv.id}#pay-now`}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-brand text-white text-xs font-semibold hover:brightness-110 transition-all whitespace-nowrap"
                >
                  <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{hasPendingReview ? 'Reviewing' : t.actions.payOnline}</span>
                </Link>
              )}
              {isAdmin && effectiveStatus !== 'Paid' && (
                <Button
                  type="button"
                  variant="success"
                  size="sm"
                  onClick={() => onMarkPaid(inv)}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                >
                  {t.actions.markPaid}
                </Button>
              )}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(inv)}
                    aria-label={`Edit ${invoiceNumber}`}
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border border-border-strong bg-surface text-muted hover:text-primary-600 hover:bg-surface-muted transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => onRequestDelete(inv)}
                    aria-label={`Delete ${invoiceNumber}`}
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border border-danger/25 bg-danger-soft text-danger-text hover:bg-danger hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
