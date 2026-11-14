import {Printer, Receipt} from 'lucide-react';
import {
  AGENCY_ADDRESS,
  AGENCY_NAME,
  AGENCY_PHONE,
  formatBDT,
} from '@/lib/constants';
import type {InvoiceRecord, PaymentSubmissionRecord} from '@/types/portal';
import {formatDateDisplay, formatDateTime} from '@/utils/format';

interface InvoiceReceiptSheetProps {
  invoice: InvoiceRecord;
  verifiedSubmission?: PaymentSubmissionRecord;
  showForPrint: boolean;
  onPrintReceipt: () => void;
}

export function InvoiceReceiptSheet({
  invoice,
  verifiedSubmission,
  showForPrint,
  onPrintReceipt,
}: InvoiceReceiptSheetProps) {
  const receiptNumber = `RCP-${invoice.invoiceNumber.replace(/^SD-/, '')}`;

  return (
    <article
      aria-label="Official Payment Receipt"
      className={`bg-white text-slate-900 rounded-2xl border border-emerald-200 shadow-sm overflow-hidden print:border print:border-slate-300 print:shadow-none print:rounded-none ${
        showForPrint ? 'print:block' : 'print:hidden'
      }`}
    >
      <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-emerald-700" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment Receipt</h3>
            <p className="text-xs text-slate-600 tabular-nums">{receiptNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-300 bg-white text-emerald-700">
            PAID IN FULL
          </span>
          <button
            type="button"
            onClick={onPrintReceipt}
            className="print:hidden inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-lg font-bold text-indigo-700">{AGENCY_NAME}</p>
            <p className="text-xs text-slate-600">{AGENCY_ADDRESS}</p>
            <p className="text-xs text-slate-600 tabular-nums">{AGENCY_PHONE}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-slate-500">Amount Received</p>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">
              {formatBDT(invoice.amount)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Received From</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">
              {invoice.clientName || 'Client'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Invoice Reference</dt>
            <dd className="font-semibold text-slate-900 tabular-nums mt-0.5">
              {invoice.invoiceNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Project</dt>
            <dd className="font-medium text-slate-800 mt-0.5">
              {invoice.projectTitle || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Payment Date</dt>
            <dd className="font-medium text-slate-800 tabular-nums mt-0.5">
              {invoice.paidAt
                ? formatDateTime(invoice.paidAt)
                : formatDateDisplay(invoice.issueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Payment Method</dt>
            <dd className="font-medium text-slate-800 mt-0.5">
              {invoice.paymentMethod || verifiedSubmission?.method || 'Recorded'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Transaction Reference / TrxID</dt>
            <dd className="font-mono font-semibold text-slate-900 mt-0.5">
              {invoice.paymentReference ||
                verifiedSubmission?.transactionId ||
                'Manual confirmation'}
            </dd>
          </div>
          {verifiedSubmission?.senderNumber && (
            <div>
              <dt className="text-xs text-slate-500">Sender Account / Number</dt>
              <dd className="font-mono text-slate-800 mt-0.5 tabular-nums">
                {verifiedSubmission.senderNumber}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-slate-500">Verification Status</dt>
            <dd className="font-medium text-emerald-700 mt-0.5">
              Verified by Stack Dev
            </dd>
          </div>
        </dl>

        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          This is an official payment receipt generated by {AGENCY_NAME} Client Portal.
        </div>
      </div>
    </article>
  );
}
