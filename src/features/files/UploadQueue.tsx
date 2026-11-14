import {RotateCcw, X} from 'lucide-react';
import {Button, Card} from '@/components/ui';
import {formatFileSize} from '@/utils/fileSharing';

export interface ActiveUploadItem {
  id: string;
  file: File;
  mimeType: string;
  fileName: string;
  totalBytes: number;
  loadedBytes: number;
  progress: number;
  status: 'uploading' | 'saving' | 'error' | 'cancelled';
  errorMessage?: string;
}

interface UploadQueueProps {
  uploads: ActiveUploadItem[];
  onCancel: (id: string) => void;
  onRetry: (item: ActiveUploadItem) => void;
  onDismiss: (id: string) => void;
}

export function UploadQueue({uploads, onCancel, onRetry, onDismiss}: UploadQueueProps) {
  if (uploads.length === 0) return null;

  return (
    <Card className="p-4 sm:p-5 space-y-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Uploads ({uploads.length})
      </h4>
      <ul className="space-y-3">
        {uploads.map((item) => {
          const isFailedOrCancelled = item.status === 'error' || item.status === 'cancelled';

          return (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-surface-muted p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.fileName}</p>
                  <p
                    className={`text-xs num ${
                      item.status === 'error' ? 'text-danger-text font-medium' : 'text-muted'
                    }`}
                  >
                    {item.status === 'saving'
                      ? 'Saving file record...'
                      : isFailedOrCancelled
                        ? item.errorMessage
                        : `Uploading (${formatFileSize(item.loadedBytes)} / ${formatFileSize(item.totalBytes)}) · ${item.progress}%`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === 'uploading' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onCancel(item.id)}
                      aria-label={`Cancel upload for ${item.fileName}`}
                      icon={<X className="w-3.5 h-3.5" aria-hidden="true" />}
                    >
                      Cancel
                    </Button>
                  )}

                  {isFailedOrCancelled && (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => onRetry(item)}
                        aria-label={`Retry upload for ${item.fileName}`}
                        icon={<RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />}
                      >
                        Retry
                      </Button>
                      <button
                        type="button"
                        onClick={() => onDismiss(item.id)}
                        aria-label={`Dismiss ${item.fileName}`}
                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {!isFailedOrCancelled && (
                <div
                  role="progressbar"
                  aria-valuenow={item.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Upload progress for ${item.fileName}`}
                  className="h-2 rounded-full bg-surface border border-border overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-gradient-brand transition-all duration-150"
                    style={{width: `${item.progress}%`}}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
