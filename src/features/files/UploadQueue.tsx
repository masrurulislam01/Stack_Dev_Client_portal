import {RotateCcw, X} from 'lucide-react';
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Uploads ({uploads.length})
      </h4>
      <ul className="space-y-3">
        {uploads.map((item) => {
          const isFailedOrCancelled = item.status === 'error' || item.status === 'cancelled';

          return (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.fileName}
                  </p>
                  <p
                    className={`text-xs tabular-nums ${
                      item.status === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-500 dark:text-slate-400'
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
                    <button
                      type="button"
                      onClick={() => onCancel(item.id)}
                      aria-label={`Cancel upload for ${item.fileName}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cancel</span>
                    </button>
                  )}

                  {isFailedOrCancelled && (
                    <>
                      <button
                        type="button"
                        onClick={() => onRetry(item)}
                        aria-label={`Retry upload for ${item.fileName}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Retry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismiss(item.id)}
                        aria-label={`Dismiss ${item.fileName}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
                  className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-150"
                    style={{width: `${item.progress}%`}}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
