import {Download, Eye, Loader2} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {ProjectFileRecord} from '@/types/portal';
import {
  formatFileSize,
  getFileTypeLabel,
  isPreviewableFile,
} from '@/utils/fileSharing';
import {formatDateTime} from '@/utils/format';

interface GlobalFilesTableProps {
  files: ProjectFileRecord[];
  isAdmin: boolean;
  downloadingId: string | null;
  onPreview: (file: ProjectFileRecord) => void;
  onDownload: (file: ProjectFileRecord) => void;
}

export function GlobalFilesTable({
  files,
  isAdmin,
  downloadingId,
  onPreview,
  onDownload,
}: GlobalFilesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
            <th className="py-3 px-6">File</th>
            <th className="py-3 px-4">Project</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Size</th>
            <th className="py-3 px-4">Uploader</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          {files.map((file) => {
            const isDownloading = downloadingId === file.id;
            return (
              <tr
                key={file.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3.5 px-6 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                  {file.name}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Link
                    to={isAdmin ? `/admin/projects/${file.projectId}` : `/projects/${file.projectId}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {file.projectTitle || 'View Project'}
                  </Link>
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {getFileTypeLabel(file.extension, file.mimeType)}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                  {formatFileSize(file.size)}
                </td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {file.uploadedByName}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                  {formatDateTime(file.createdAt)}
                </td>
                <td className="py-3.5 px-6 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    {isPreviewableFile(file.extension, file.mimeType) && (
                      <button
                        type="button"
                        onClick={() => onPreview(file)}
                        aria-label={`Preview ${file.name}`}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => onDownload(file)}
                      aria-label={`Download ${file.name}`}
                      className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
