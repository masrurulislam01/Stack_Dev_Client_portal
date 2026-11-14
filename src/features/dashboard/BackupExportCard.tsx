import {AlertCircle, DatabaseBackup, Download, FileSpreadsheet} from 'lucide-react';
import {useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {useToast} from '@/hooks/useToast';
import {getErrorMessage} from '@/services/serviceUtils';
import {
  downloadCsvBackups,
  downloadJsonBackup,
  fetchBackupSnapshot,
} from '@/utils/backupExport';
import {formatDateTime} from '@/utils/format';

export function BackupExportCard() {
  const {user} = useAuth();
  const {t} = useLanguage();
  const toast = useToast();

  const [exportingFormat, setExportingFormat] = useState<'json' | 'csv' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExportSummary, setLastExportSummary] = useState<string | null>(null);

  const handleExportData = async (format: 'json' | 'csv') => {
    if (exportingFormat) return;
    setExportError(null);
    setExportingFormat(format);
    try {
      const snapshot = await fetchBackupSnapshot(user?.email ?? 'admin');
      if (format === 'json') {
        downloadJsonBackup(snapshot);
      } else {
        await downloadCsvBackups(snapshot);
      }
      const summary = `${snapshot.counts.clients} clients · ${snapshot.counts.projects} projects · ${snapshot.counts.invoices} invoices · ${snapshot.counts.paymentSubmissions} payments · ${formatDateTime(snapshot.exportedAt)}`;
      setLastExportSummary(summary);
      toast.success(
        format === 'json' ? 'JSON backup downloaded' : 'CSV backups downloaded',
        `Exported ${snapshot.counts.clients} clients, ${snapshot.counts.projects} projects, ${snapshot.counts.invoices} invoices, and ${snapshot.counts.paymentSubmissions} payments.`,
      );
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to export backup data.');
      console.error('[BackupExportCard] Export backup failed:', err);
      setExportError(message);
      toast.error('Export failed', message);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <DatabaseBackup className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.settings.backupSection}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t.settings.backupHint}
          </p>
        </div>
      </div>

      {exportError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{exportError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
          <p>Includes all clients, projects, invoices (including drafts), and payment records.</p>
          {lastExportSummary && (
            <p className="text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
              Last export: {lastExportSummary}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => void handleExportData('csv')}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            <span>{exportingFormat === 'csv' ? t.settings.exporting : t.settings.exportCsv}</span>
          </button>

          <button
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => void handleExportData('json')}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>{exportingFormat === 'json' ? t.settings.exporting : t.settings.exportJson}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
