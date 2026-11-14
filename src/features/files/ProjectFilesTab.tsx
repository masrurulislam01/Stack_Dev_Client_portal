import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {AlertCircle, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import type {PortalUser} from '@/features/auth/AuthContext';
import {FileDropzone} from '@/features/files/FileDropzone';
import {FilePreviewModal} from '@/features/files/FilePreviewModal';
import {FileUploadQueue} from '@/features/files/FileUploadQueue';
import {ProjectFileList} from '@/features/files/ProjectFileList';
import {useProjectFileUploads} from '@/features/files/useProjectFileUploads';
import {useToast} from '@/hooks';
import {queryKeys} from '@/lib/queryKeys';
import {
  getSignedDownloadUrl,
  list as listProjectFiles,
  remove as deleteProjectFile,
  SIGNED_URL_EXPIRY_SECONDS,
} from '@/services/files';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ProjectFileRecord, ProjectRecord} from '@/types/portal';
import {triggerFileDownload} from '@/utils/fileSharing';

interface ProjectFilesTabProps {
  project: ProjectRecord;
  user: PortalUser;
}

export function ProjectFilesTab({project, user}: ProjectFilesTabProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [actionError, setActionError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ProjectFileRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const {
    uploads,
    validationErrors,
    clearValidationErrors,
    handleSelectedFiles,
    cancelUpload,
    retryUpload,
    dismissUpload,
  } = useProjectFileUploads(project, user);

  const {data: files = [], isLoading: loading, error: loadError} = useQuery({
    queryKey: queryKeys.files.list({projectId: project.id}),
    queryFn: () =>
      listProjectFiles({projectId: project.id, viewerId: user.id, viewerName: user.name, viewerRole: user.role}),
  });

  useEffect(() => {
    if (loadError) {
      const msg = getErrorMessage(loadError, 'Unable to load shared files.');
      console.error('[ProjectFilesTab] File list query error:', loadError);
      toast.error('Could not load files', msg);
    }
  }, [loadError, toast]);

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteProjectFile(fileId),
    onSuccess: () => void queryClient.invalidateQueries({queryKey: queryKeys.files.prefix}),
  });

  const canDeleteFile = (file: ProjectFileRecord): boolean =>
    user.role === 'admin' || file.uploadedByUid === user.id;

  const handleDownloadFile = async (file: ProjectFileRecord) => {
    setActionError(null);
    setDownloadingId(file.id);
    try {
      const freshUrl = await getSignedDownloadUrl(file.storagePath, SIGNED_URL_EXPIRY_SECONDS);
      await triggerFileDownload(freshUrl, file.name);
    } catch (err) {
      const message = getErrorMessage(err, `Could not download "${file.name}".`);
      console.error('[ProjectFilesTab] Download failed for file:', file.id, file.storagePath, err);
      setActionError(message);
      toast.error('Download failed', message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteFile = async (file: ProjectFileRecord) => {
    if (!canDeleteFile(file)) return;
    setActionError(null);
    setDeletingId(file.id);
    try {
      await deleteMutation.mutateAsync(file.id);
      if (previewFile?.id === file.id) setPreviewFile(null);
      setConfirmDeleteId(null);
      toast.success('File deleted', `"${file.name}" was permanently removed.`);
    } catch (err) {
      const message = getErrorMessage(err, 'Could not delete the selected file. Please try again.');
      console.error('[ProjectFilesTab] Delete failed for file:', file.id, file.storagePath, err);
      setActionError(message);
      toast.error('Delete failed', message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        onFilesSelected={(fileList) => {
          setActionError(null);
          handleSelectedFiles(fileList);
        }}
      />

      {validationErrors.length > 0 && (
        <div role="alert" className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <ul className="space-y-1">
              {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </div>
          <button type="button" onClick={clearValidationErrors} aria-label="Dismiss file validation errors" className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {(actionError || loadError) && (
        <div role="alert" className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{actionError || getErrorMessage(loadError, 'Unable to load shared files.')}</span>
          </div>
          {actionError && (
            <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error" className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <FileUploadQueue uploads={uploads} onCancel={cancelUpload} onRetry={retryUpload} onDismiss={dismissUpload} />

      <ProjectFileList
        projectTitle={project.title}
        files={files}
        loading={loading}
        canDelete={canDeleteFile}
        confirmDeleteId={confirmDeleteId}
        deletingId={deletingId}
        downloadingId={downloadingId}
        onPreview={setPreviewFile}
        onDownload={(file) => void handleDownloadFile(file)}
        onRequestDelete={setConfirmDeleteId}
        onCancelDelete={() => setConfirmDeleteId(null)}
        onConfirmDelete={(file) => void handleDeleteFile(file)}
      />

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
