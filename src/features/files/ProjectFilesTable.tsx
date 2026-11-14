import {Download, Eye, Loader2, Trash2} from 'lucide-react';
import {FileCategoryIcon} from '@/features/files/FileCategoryIcon';
import type {ProjectFileRecord} from '@/types/portal';
import {formatFileSize, getFileTypeLabel, isPreviewableFile} from '@/utils/fileSharing';
import {formatDateTime} from '@/utils/format';

interface ProjectFilesTableProps {
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

export function ProjectFilesTable({
  files,
  confirmDeleteId,
  deletingId,
  downloadingId,
  canDeleteFile,
  onPreview,
  onDownload,
  onRequestDelete,
  onConfirmDelete,
}: ProjectFilesTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
            <th className="py-3 px-6">File Name</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Size</th>
            <th className="py-3 px-4">Uploader</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          {files.map((file) => {
            const previewable = isPreviewableFile(file.extension, file.mimeType);
            const deletable = canDeleteFile(file);
            const isConfirming = confirmDeleteId === file.id;
            const isDeleting = deletingId === file.id;
            const isDownloading = downloadingId === file.id;

            return (
              <tr
                key={file.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-3 min-w-0 max-w-xs">
                    <FileCategoryIcon extension={file.extension} mimeType={file.mimeType} />
                    <div className="min-w-0">
                      <p
                        title={file.name}
                        className="font-medium text-slate-900 dark:text-slate-100 truncate"
                      >
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                        .{file.extension || 'file'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {getFileTypeLabel(file.extension, file.mimeType)}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                  {formatFileSize(file.size)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {file.uploadedByName}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        file.uploadedByRole === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/60'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {file.uploadedByRole === 'admin' ? 'Admin' : 'Client'}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                  {formatDateTime(file.createdAt)}
                </td>
                <td className="py-3.5 px-6 text-right whitespace-nowrap">
                  {isConfirming ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onConfirmDelete(file)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onRequestDelete(null)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1">
                      {previewable && (
                        <button
                          type="button"
                          onClick={() => onPreview(file)}
                          aria-label={`Preview ${file.name}`}
                          title="Preview"
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isDownloading}
                        onClick={() => onDownload(file)}
                        aria-label={`Download ${file.name}`}
                        title="Download"
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-50 transition-colors"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Download className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                      {deletable && (
                        <button
                          type="button"
                          onClick={() => onRequestDelete(file.id)}
                          aria-label={`Delete ${file.name}`}
                          title="Delete"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
