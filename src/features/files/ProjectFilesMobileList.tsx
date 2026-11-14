import {Download, Eye, Loader2, Trash2} from 'lucide-react';
import {Button} from '@/components/ui';
import {FileCategoryIcon} from '@/features/files/FileCategoryIcon';
import type {ProjectFileRecord} from '@/types/portal';
import {formatFileSize, getFileTypeLabel, isPreviewableFile} from '@/utils/fileSharing';
import {formatDateTime} from '@/utils/format';

interface ProjectFilesMobileListProps {
  files: ProjectFileRecord[];
  deletingId: string | null;
  downloadingId: string | null;
  canDeleteFile: (file: ProjectFileRecord) => boolean;
  onPreview: (file: ProjectFileRecord) => void;
  onDownload: (file: ProjectFileRecord) => void;
  onRequestDelete: (file: ProjectFileRecord) => void;
}

export function ProjectFilesMobileList({
  files,
  deletingId,
  downloadingId,
  canDeleteFile,
  onPreview,
  onDownload,
  onRequestDelete,
}: ProjectFilesMobileListProps) {
  return (
    <ul className="md:hidden divide-y divide-border">
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
          <li key={file.id} className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileCategoryIcon extension={ext} mimeType={mimeType} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground break-words">{fileName}</p>
                <p className="text-xs text-muted mt-0.5 num">
                  {getFileTypeLabel(ext, mimeType)} · {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-muted mt-0.5 num">
                  {uploaderName} ({file.uploadedByRole === 'admin' ? 'Admin' : 'Client'}) ·{' '}
                  {formatDateTime(file.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {previewable && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onPreview(file)}
                  icon={<Eye className="w-3.5 h-3.5" aria-hidden="true" />}
                >
                  Preview
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isDownloading}
                onClick={() => onDownload(file)}
                icon={
                  isDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  )
                }
              >
                {isDownloading ? 'Preparing...' : 'Download'}
              </Button>

              {deletable && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => onRequestDelete(file)}
                  icon={<Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                  className="ml-auto"
                >
                  Delete
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
