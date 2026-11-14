import {Download, Eye, Loader2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {TableContainer, TableHead, TableHeaderCell} from '@/components/ui';
import {FileCategoryIcon} from '@/features/files/FileCategoryIcon';
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
    <TableContainer>
      <TableHead>
        <TableHeaderCell className="px-6">File</TableHeaderCell>
        <TableHeaderCell>Project</TableHeaderCell>
        <TableHeaderCell>Type</TableHeaderCell>
        <TableHeaderCell>Size</TableHeaderCell>
        <TableHeaderCell>Uploader</TableHeaderCell>
        <TableHeaderCell>Date</TableHeaderCell>
        <TableHeaderCell align="right" className="px-6">
          Actions
        </TableHeaderCell>
      </TableHead>
      <tbody className="divide-y divide-border text-sm">
        {files.map((file) => {
          const isDownloading = downloadingId === file.id;
          const fileName = file.name || 'Untitled file';
          const ext = file.extension ?? '';
          const mimeType = file.mimeType ?? '';
          const uploaderName = file.uploadedByName || 'Team member';
          return (
            <tr key={file.id} className="h-[56px] hover:bg-surface-muted/60 transition-colors">
              <td className="py-3.5 px-6 font-semibold text-foreground max-w-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <FileCategoryIcon extension={ext} mimeType={mimeType} />
                  <span title={fileName} className="truncate">
                    {fileName}
                  </span>
                </div>
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <Link
                  to={isAdmin ? `/admin/projects/${file.projectId}` : `/projects/${file.projectId}`}
                  className="text-primary-600 hover:text-primary-700 hover:underline font-semibold"
                >
                  {file.projectTitle || 'View Project'}
                </Link>
              </td>
              <td className="py-3.5 px-4 text-body whitespace-nowrap">
                {getFileTypeLabel(ext, mimeType)}
              </td>
              <td className="py-3.5 px-4 text-body num whitespace-nowrap">
                {formatFileSize(file.size)}
              </td>
              <td className="py-3.5 px-4 text-foreground font-medium whitespace-nowrap">
                {uploaderName}
              </td>
              <td className="py-3.5 px-4 text-xs text-muted num whitespace-nowrap">
                {formatDateTime(file.createdAt)}
              </td>
              <td className="py-3.5 px-6 text-right whitespace-nowrap">
                <div className="inline-flex items-center gap-1">
                  {isPreviewableFile(ext, mimeType) && (
                    <button
                      type="button"
                      onClick={() => onPreview(file)}
                      aria-label={`Preview ${fileName}`}
                      className="p-2 rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={() => onDownload(file)}
                    aria-label={`Download ${fileName}`}
                    className="p-2 rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
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
    </TableContainer>
  );
}
