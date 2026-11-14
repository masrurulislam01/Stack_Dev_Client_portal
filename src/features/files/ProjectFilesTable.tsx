import {Download, Eye, Loader2, Trash2} from 'lucide-react';
import {Badge, TableContainer, TableHead, TableHeaderCell} from '@/components/ui';
import {FileCategoryIcon} from '@/features/files/FileCategoryIcon';
import type {ProjectFileRecord} from '@/types/portal';
import {formatFileSize, getFileTypeLabel, isPreviewableFile} from '@/utils/fileSharing';
import {formatDateTime} from '@/utils/format';

interface ProjectFilesTableProps {
  files: ProjectFileRecord[];
  deletingId: string | null;
  downloadingId: string | null;
  canDeleteFile: (file: ProjectFileRecord) => boolean;
  onPreview: (file: ProjectFileRecord) => void;
  onDownload: (file: ProjectFileRecord) => void;
  onRequestDelete: (file: ProjectFileRecord) => void;
}

export function ProjectFilesTable({
  files,
  deletingId,
  downloadingId,
  canDeleteFile,
  onPreview,
  onDownload,
  onRequestDelete,
}: ProjectFilesTableProps) {
  return (
    <TableContainer className="hidden md:block border-0 rounded-none shadow-none">
      <TableHead>
        <TableHeaderCell className="px-6">File Name</TableHeaderCell>
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
          const fileName = file.name || 'Untitled file';
          const ext = file.extension ?? '';
          const mimeType = file.mimeType ?? '';
          const uploaderName = file.uploadedByName || 'Team member';
          const previewable = isPreviewableFile(ext, mimeType);
          const deletable = canDeleteFile(file);
          const isDeleting = deletingId === file.id;
          const isDownloading = downloadingId === file.id;

          return (
            <tr key={file.id} className="h-[56px] hover:bg-surface-muted/60 transition-colors">
              <td className="py-3.5 px-6">
                <div className="flex items-center gap-3 min-w-0 max-w-xs">
                  <FileCategoryIcon extension={ext} mimeType={mimeType} />
                  <div className="min-w-0">
                    <p title={fileName} className="font-semibold text-foreground truncate">
                      {fileName}
                    </p>
                    <p className="font-mono text-[11px] text-muted uppercase">.{ext || 'file'}</p>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4 text-body whitespace-nowrap">
                {getFileTypeLabel(ext, mimeType)}
              </td>
              <td className="py-3.5 px-4 text-body num whitespace-nowrap">
                {formatFileSize(file.size)}
              </td>
              <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">{uploaderName}</span>
                  <Badge tone={file.uploadedByRole === 'admin' ? 'primary' : 'neutral'}>
                    {file.uploadedByRole === 'admin' ? 'Admin' : 'Client'}
                  </Badge>
                </div>
              </td>
              <td className="py-3.5 px-4 text-xs text-muted num whitespace-nowrap">
                {formatDateTime(file.createdAt)}
              </td>
              <td className="py-3.5 px-6 text-right whitespace-nowrap">
                <div className="inline-flex items-center gap-1">
                  {previewable && (
                    <button
                      type="button"
                      onClick={() => onPreview(file)}
                      aria-label={`Preview ${fileName}`}
                      title="Preview"
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
                    title="Download"
                    className="p-2 rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
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
                      disabled={isDeleting}
                      onClick={() => onRequestDelete(file)}
                      aria-label={`Delete ${fileName}`}
                      title="Delete"
                      className="p-2 rounded-xl text-muted hover:text-danger-text hover:bg-danger-soft disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableContainer>
  );
}
