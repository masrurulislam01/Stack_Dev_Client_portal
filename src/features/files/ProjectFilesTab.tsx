import {AlertCircle, FolderOpen, UploadCloud, X} from 'lucide-react';
import {useRef} from 'react';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorAlert,
  TableContainer,
  TableHead,
  TableHeaderCell,
} from '@/components/ui';
import {FileDropzone} from '@/features/files/FileDropzone';
import {FilePreviewModal} from '@/features/files/FilePreviewModal';
import {ProjectFilesMobileList} from '@/features/files/ProjectFilesMobileList';
import {ProjectFilesTable} from '@/features/files/ProjectFilesTable';
import {UploadQueue} from '@/features/files/UploadQueue';
import {useProjectFiles} from '@/features/files/useProjectFiles';
import type {PortalUser} from '@/hooks/useAuth';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ProjectRecord} from '@/types/portal';

interface ProjectFilesTabProps {
  project: ProjectRecord;
  user: PortalUser;
}

export function ProjectFilesTab({project, user}: ProjectFilesTabProps) {
  const state = useProjectFiles(project, user);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayedError =
    state.actionError ||
    (state.loadError ? getErrorMessage(state.loadError, 'Unable to load shared files.') : null);

  return (
    <div className="space-y-6">
      <FileDropzone inputRef={fileInputRef} onSelectFiles={state.handleSelectedFiles} />

      {state.validationErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm text-danger-text"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" aria-hidden="true" />
            <ul className="space-y-1">
              {state.validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => state.setValidationErrors([])}
            aria-label="Dismiss file validation errors"
            className="p-1 rounded-lg hover:bg-danger/15 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {displayedError && (
        <ErrorAlert
          message={displayedError}
          onRetry={state.loadError ? () => void state.refetchFiles() : undefined}
          retrying={state.isRetryingFiles}
          onDismiss={state.actionError ? () => state.setActionError(null) : undefined}
        />
      )}

      <UploadQueue
        uploads={state.uploads}
        onCancel={state.handleCancelUpload}
        onRetry={state.handleRetryUpload}
        onDismiss={state.handleDismissUpload}
      />

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">Shared Files</h3>
            <p className="text-xs text-muted mt-0.5">
              Private deliverables, builds, designs, and assets for {project.title || 'this project'}.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted num whitespace-nowrap">
            {state.files.length} {state.files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {state.loading ? (
          <>
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
              <tbody className="divide-y divide-border">
                {[1, 2, 3].map((row) => (
                  <tr key={row} className="h-[56px]">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-40 rounded skeleton-shimmer" />
                          <div className="h-3 w-12 rounded skeleton-shimmer" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-24 rounded skeleton-shimmer" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-16 rounded skeleton-shimmer" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-4 w-28 rounded skeleton-shimmer" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-3.5 w-24 rounded skeleton-shimmer" />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                        <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableContainer>
            <ul className="md:hidden divide-y divide-border">
              {[1, 2, 3].map((row) => (
                <li key={row} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-44 rounded skeleton-shimmer" />
                      <div className="h-3 w-32 rounded skeleton-shimmer" />
                      <div className="h-3 w-40 rounded skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
                    <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : state.files.length === 0 ? (
          <EmptyState
            className="border-0 rounded-none shadow-none py-10"
            icon={<FolderOpen className="w-5 h-5" aria-hidden="true" />}
            title="No files uploaded yet"
            description="Drag and drop PDFs, documents, spreadsheets, archives, or images above to share them with the project team."
            action={
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<UploadCloud className="w-4 h-4" aria-hidden="true" />}
              >
                Upload Files
              </Button>
            }
          />
        ) : (
          <>
            <ProjectFilesTable
              files={state.files}
              deletingId={state.deletingId}
              downloadingId={state.downloadingId}
              canDeleteFile={state.canDeleteFile}
              onPreview={state.setPreviewFile}
              onDownload={(f) => void state.handleDownloadFile(f)}
              onRequestDelete={state.requestDeleteFile}
            />
            <ProjectFilesMobileList
              files={state.files}
              deletingId={state.deletingId}
              downloadingId={state.downloadingId}
              canDeleteFile={state.canDeleteFile}
              onPreview={state.setPreviewFile}
              onDownload={(f) => void state.handleDownloadFile(f)}
              onRequestDelete={state.requestDeleteFile}
            />
          </>
        )}
      </Card>

      <FilePreviewModal file={state.previewFile} onClose={() => state.setPreviewFile(null)} />

      <ConfirmDialog
        open={Boolean(state.fileToDelete)}
        onClose={state.cancelDeleteFile}
        onConfirm={state.handleDeleteFile}
        title="Delete File"
        titleId="delete-file-title"
        confirmLabel="Delete File"
        confirmBusyLabel="Deleting..."
        loading={Boolean(state.deletingId)}
        error={state.deleteError}
        message={
          <>
            Permanently remove{' '}
            <strong className="text-foreground">
              {state.fileToDelete?.name || 'this file'}
            </strong>
            ? This action cannot be undone.
          </>
        }
      />
    </div>
  );
}
