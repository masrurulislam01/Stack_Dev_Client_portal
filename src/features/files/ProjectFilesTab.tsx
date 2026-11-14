import {AlertCircle, FolderOpen, X} from 'lucide-react';
import {FileDropzone} from '@/features/files/FileDropzone';
import {FilePreviewModal} from '@/features/files/FilePreviewModal';
import {ProjectFilesMobileList} from '@/features/files/ProjectFilesMobileList';
import {ProjectFilesTable} from '@/features/files/ProjectFilesTable';
import {UploadQueue} from '@/features/files/UploadQueue';
import {useProjectFiles} from '@/features/files/useProjectFiles';
import type {PortalUser} from '@/hooks/useAuth';
import type {ProjectRecord} from '@/types/portal';

interface ProjectFilesTabProps {
  project: ProjectRecord;
  user: PortalUser;
}

export function ProjectFilesTab({project, user}: ProjectFilesTabProps) {
  const state = useProjectFiles(project, user);

  return (
    <div className="space-y-6">
      <FileDropzone onSelectFiles={state.handleSelectedFiles} />

      {state.validationErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
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
            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {(state.actionError || state.loadError) && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {state.actionError ||
                (state.loadError instanceof Error
                  ? state.loadError.message
                  : 'Unable to load shared files.')}
            </span>
          </div>
          {state.actionError && (
            <button
              type="button"
              onClick={() => state.setActionError(null)}
              aria-label="Dismiss error"
              className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <UploadQueue
        uploads={state.uploads}
        onCancel={state.handleCancelUpload}
        onRetry={state.handleRetryUpload}
        onDismiss={state.handleDismissUpload}
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Shared Files
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Private deliverables, builds, designs, and assets for {project.title}.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
            {state.files.length} {state.files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {state.loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : state.files.length === 0 ? (
          <div className="p-10 text-center">
            <FolderOpen
              className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No files uploaded yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Drag and drop PDFs, documents, spreadsheets, archives, or images above to share them
              with the project team.
            </p>
          </div>
        ) : (
          <>
            <ProjectFilesTable
              files={state.files}
              confirmDeleteId={state.confirmDeleteId}
              deletingId={state.deletingId}
              downloadingId={state.downloadingId}
              canDeleteFile={state.canDeleteFile}
              onPreview={state.setPreviewFile}
              onDownload={(f) => void state.handleDownloadFile(f)}
              onRequestDelete={state.setConfirmDeleteId}
              onConfirmDelete={(f) => void state.handleDeleteFile(f)}
            />
            <ProjectFilesMobileList
              files={state.files}
              confirmDeleteId={state.confirmDeleteId}
              deletingId={state.deletingId}
              downloadingId={state.downloadingId}
              canDeleteFile={state.canDeleteFile}
              onPreview={state.setPreviewFile}
              onDownload={(f) => void state.handleDownloadFile(f)}
              onRequestDelete={state.setConfirmDeleteId}
              onConfirmDelete={(f) => void state.handleDeleteFile(f)}
            />
          </>
        )}
      </div>

      <FilePreviewModal file={state.previewFile} onClose={() => state.setPreviewFile(null)} />
    </div>
  );
}
