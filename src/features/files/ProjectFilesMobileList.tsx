import {Download, Eye, Loader2, Trash2} from 'lucide-react';
import {FileCategoryIcon} from '@/features/files/FileCategoryIcon';
import type {ProjectFileRecord} from '@/types/portal';
import {formatFileSize, getFileTypeLabel, isPreviewableFile} from '@/utils/fileSharing';
import {formatDateTime} from '@/utils/format';

interface ProjectFilesMobileListProps {
  files: ProjectFileRecord[];
  confirmDeleteId: string | null;
  deletingId: string | null;
  downloadingId: string | null;
  canDeleteFile: (file: ProjectFileRecord) => boolean;
  onPreview: (file: ProjectFileRecord) => void;
  onDownload: (file: ProjectFileRecord) => void;
  onRequestDelete: (id: string | null) => void;
  onConfirmDelete: (file: ProjectFileRecord) => void;
}

export function ProjectFilesMobileList({
  files,
  confirmDeleteId,
  deletingId,
  downloadingId,
  canDeleteFile,
  onPreview,
  onDownload,
  onRequestDelete,
  onConfirmDelete,
}: ProjectFilesMobileListProps) {
  return (
    <ul className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
      {files.map((file) => {
        const previewable = isPreviewableFile(file.extension, file.mimeType);
        const deletable = canDeleteFile(file);
        const isConfirming = confirmDeleteId === file.id;
        const isDeleting = deletingId === file.id;
        const isDownloading = downloadingId === file.id;

        return (
          <li key={file.id} className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileCategoryIcon extension={file.extension} mimeType={file.mimeType} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {getFileTypeLabel(file.extension, file.mimeType)} · {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {file.uploadedByName} ({file.uploadedByRole === 'admin' ? 'Admin' : 'Client'}) ·{' '}
                  {formatDateTime(file.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {previewable && (
                <button
                  type="button"
                  onClick={() => onPreview(file)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Preview</span>
                </button>
              )}
              <button
                type="button"
                disabled={isDownloading}
                onClick={() => onDownload(file)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isDownloading ? 'Preparing...' : 'Download'}</span>
              </button>

              {deletable &&
                (isConfirming ? (
                  <div className="inline-flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => onConfirmDelete(file)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => onRequestDelete(null)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestDelete(file.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
