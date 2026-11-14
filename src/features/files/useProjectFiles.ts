import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect, useRef, useState} from 'react';
import type {ActiveUploadItem} from '@/features/files/UploadQueue';
import {useToast} from '@/hooks/useToast';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as uploadProjectFile,
  getSignedDownloadUrl,
  list as listProjectFiles,
  remove as deleteProjectFile,
  SIGNED_URL_EXPIRY_SECONDS,
  UploadCancelledError,
} from '@/services/files';
import {getErrorMessage} from '@/services/serviceUtils';
import type {PortalUser} from '@/hooks/useAuth';
import type {ProjectFileRecord, ProjectRecord} from '@/types/portal';
import {triggerFileDownload, validateProjectFile} from '@/utils/fileSharing';

export function useProjectFiles(project: ProjectRecord, user: PortalUser) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<ActiveUploadItem[]>([]);
  const [previewFile, setPreviewFile] = useState<ProjectFileRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    const controllers = abortControllersRef.current;
    return () => {
      for (const controller of controllers.values()) {
        controller.abort();
      }
      controllers.clear();
    };
  }, []);

  const {
    data: files = [],
    isLoading: loading,
    error: loadError,
  } = useQuery({
    queryKey: queryKeys.files.list({projectId: project.id}),
    queryFn: () =>
      listProjectFiles({
        projectId: project.id,
        viewerId: user.id,
        viewerName: user.name,
        viewerRole: user.role,
      }),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.files.prefix});
    },
  });

  const runFileUpload = async (
    uploadId: string,
    file: File,
    resolvedMimeType: string,
    isRetry = false,
  ) => {
    const controller = new AbortController();
    abortControllersRef.current.set(uploadId, controller);

    if (isRetry) {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === uploadId
            ? {...item, progress: 0, loadedBytes: 0, status: 'uploading', errorMessage: undefined}
            : item,
        ),
      );
    } else {
      setUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          file,
          mimeType: resolvedMimeType,
          fileName: file.name,
          totalBytes: file.size,
          loadedBytes: 0,
          progress: 0,
          status: 'uploading',
        },
      ]);
    }

    try {
      await uploadProjectFile({
        projectId: project.id,
        clientId: project.clientId,
        uploadedByUid: user.id,
        uploadedByName: user.name,
        uploadedByRole: user.role,
        file,
        mimeType: resolvedMimeType,
        signal: controller.signal,
        onProgress: (pct, loadedBytes) => {
          setUploads((prev) =>
            prev.map((item) =>
              item.id === uploadId
                ? {
                    ...item,
                    progress: pct,
                    loadedBytes: loadedBytes ?? item.loadedBytes,
                    status: pct >= 96 ? 'saving' : 'uploading',
                  }
                : item,
            ),
          );
        },
      });
      await queryClient.invalidateQueries({queryKey: queryKeys.files.prefix});
      setUploads((prev) => prev.filter((item) => item.id !== uploadId));
      toast.success('File uploaded', `"${file.name}" is now available in Shared Files.`);
    } catch (err) {
      if (err instanceof UploadCancelledError) {
        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId
              ? {...item, status: 'cancelled', errorMessage: 'Upload cancelled.'}
              : item,
          ),
        );
        toast.info('Upload cancelled', `"${file.name}" upload was cancelled.`);
        return;
      }
      const message = getErrorMessage(err, 'Upload failed. Please try again.');
      console.error('[ProjectFilesTab] Upload failed for file:', file.name, err);
      toast.error(`Failed to upload ${file.name}`, message);
      setUploads((prev) =>
        prev.map((item) =>
          item.id === uploadId ? {...item, status: 'error', errorMessage: message} : item,
        ),
      );
    } finally {
      abortControllersRef.current.delete(uploadId);
    }
  };

  const handleSelectedFiles = (fileList: FileList | File[]) => {
    setActionError(null);
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const errors: string[] = [];
    for (const file of incoming) {
      const validation = validateProjectFile(file);
      if (!validation.valid) {
        errors.push(validation.error);
        console.warn('[ProjectFilesTab] File validation rejected:', file.name, validation.error);
        toast.error('Invalid file', validation.error);
        continue;
      }
      void runFileUpload(crypto.randomUUID(), file, validation.resolvedMimeType, false);
    }
    setValidationErrors(errors);
  };

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
    if (user.role !== 'admin' && file.uploadedByUid !== user.id) return;
    setActionError(null);
    setDeletingId(file.id);
    try {
      await deleteMutation.mutateAsync(file.id);
      if (previewFile?.id === file.id) setPreviewFile(null);
      setConfirmDeleteId(null);
      toast.success('File deleted', `"${file.name}" was permanently removed.`);
    } catch (err) {
      const message = getErrorMessage(
        err,
        'Could not delete the selected file. Please try again.',
      );
      console.error('[ProjectFilesTab] Delete failed for file:', file.id, file.storagePath, err);
      setActionError(message);
      toast.error('Delete failed', message);
    } finally {
      setDeletingId(null);
    }
  };

  return {
    files,
    loading,
    loadError,
    validationErrors,
    setValidationErrors,
    actionError,
    setActionError,
    uploads,
    previewFile,
    setPreviewFile,
    confirmDeleteId,
    setConfirmDeleteId,
    deletingId,
    downloadingId,
    canDeleteFile: (file: ProjectFileRecord) =>
      user.role === 'admin' || file.uploadedByUid === user.id,
    handleSelectedFiles,
    handleCancelUpload: (id: string) => abortControllersRef.current.get(id)?.abort(),
    handleRetryUpload: (item: ActiveUploadItem) => {
      if (item.status !== 'uploading' && item.status !== 'saving') {
        void runFileUpload(item.id, item.file, item.mimeType, true);
      }
    },
    handleDismissUpload: (id: string) =>
      setUploads((prev) => prev.filter((item) => item.id !== id)),
    handleDownloadFile,
    handleDeleteFile,
  };
}
