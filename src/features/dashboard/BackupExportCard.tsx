import {AlertCircle, DatabaseBackup, Download, FileSpreadsheet} from 'lucide-react';
import {useState} from 'react';
import {Button} from '@/components/ui';
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
    <div className="bg-surface rounded-2xl border border-border card-inset p-6 space-y-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <DatabaseBackup className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {t.settings.backupSection}
          </h3>
          <p className="text-xs text-muted mt-0.5">{t.settings.backupHint}</p>
        </div>
      </div>

      {exportError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{exportError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1 text-xs text-muted">
          <p>Includes all clients, projects, invoices (including drafts), and payment records.</p>
          {lastExportSummary && (
            <p className="text-success-text font-semibold num">
              Last export: {lastExportSummary}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            loading={exportingFormat === 'csv'}
            disabled={Boolean(exportingFormat)}
            icon={<FileSpreadsheet className="w-4 h-4" aria-hidden="true" />}
            onClick={() => void handleExportData('csv')}
          >
            {exportingFormat === 'csv' ? t.settings.exporting : t.settings.exportCsv}
          </Button>

          <Button
            variant="primary"
            loading={exportingFormat === 'json'}
            disabled={Boolean(exportingFormat)}
            icon={<Download className="w-4 h-4" aria-hidden="true" />}
            onClick={() => void handleExportData('json')}
          >
            {exportingFormat === 'json' ? t.settings.exporting : t.settings.exportJson}
          </Button>
        </div>
      </div>
    </div>
  );
}
