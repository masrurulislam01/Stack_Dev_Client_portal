import {AlertCircle, DatabaseBackup, Download, FileSpreadsheet} from 'lucide-react';
import {useState} from 'react';
import {Button, Card, CardContent} from '@/components/ui';
import {useAuth, useLanguage, useToast} from '@/hooks';
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
    <Card>
      <CardContent className="space-y-5">
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
            <Button
              variant="secondary"
              loading={exportingFormat === 'csv'}
              disabled={Boolean(exportingFormat)}
              onClick={() => void handleExportData('csv')}
              leftIcon={<FileSpreadsheet className="w-4 h-4" aria-hidden="true" />}
            >
              {exportingFormat === 'csv' ? t.settings.exporting : t.settings.exportCsv}
            </Button>

            <Button
              loading={exportingFormat === 'json'}
              disabled={Boolean(exportingFormat)}
              onClick={() => void handleExportData('json')}
              leftIcon={<Download className="w-4 h-4" aria-hidden="true" />}
            >
              {exportingFormat === 'json' ? t.settings.exporting : t.settings.exportJson}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
