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
import {triggerFileDownload, validateProjectFileMagicBytes} from '@/utils/fileSharing';

export function useProjectFiles(project: ProjectRecord, user: PortalUser) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<ActiveUploadItem[]>([]);
  const [previewFile, setPreviewFile] = useState<ProjectFileRecord | null>(null);
  const [fileToDelete, setFileToDelete] = useState<ProjectFileRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
    isFetching: isRetryingFiles,
    error: loadError,
    refetch: refetchFiles,
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
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({queryKey: queryKeys.files.prefix});
      const previous = queryClient.getQueriesData<ProjectFileRecord[]>({
        queryKey: queryKeys.files.prefix,
      });
      queryClient.setQueriesData<ProjectFileRecord[]>(
        {queryKey: queryKeys.files.prefix},
        (old) => (old ? old.filter((f) => f.id !== fileId) : old),
      );
      return {previous};
    },
    onError: (_err, _fileId, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
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

  const handleSelectedFiles = async (fileList: FileList | File[]) => {
    setActionError(null);
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const errors: string[] = [];
    for (const file of incoming) {
      const validation = await validateProjectFileMagicBytes(file);
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
      await triggerFileDownload(freshUrl, file.name || 'file');
    } catch (err) {
      const message = getErrorMessage(err, `Could not download "${file.name || 'file'}".`);
      console.error('[ProjectFilesTab] Download failed for file:', file.id, file.storagePath, err);
      setActionError(message);
      toast.error('Download failed', message);
    } finally {
      setDownloadingId(null);
    }
  };

  const requestDeleteFile = (file: ProjectFileRecord) => {
    setDeleteError(null);
    setFileToDelete(file);
  };

  const cancelDeleteFile = () => {
    if (deletingId) return;
    setDeleteError(null);
    setFileToDelete(null);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    if (user.role !== 'admin' && fileToDelete.uploadedByUid !== user.id) return;
    setActionError(null);
    setDeleteError(null);
    setDeletingId(fileToDelete.id);
    try {
      await deleteMutation.mutateAsync(fileToDelete.id);
      if (previewFile?.id === fileToDelete.id) setPreviewFile(null);
      toast.success('File deleted', `"${fileToDelete.name || 'File'}" was permanently removed.`);
      setFileToDelete(null);
    } catch (err) {
      const message = getErrorMessage(
        err,
        'Could not delete the selected file. Please try again.',
      );
      console.error(
        '[ProjectFilesTab] Delete failed for file:',
        fileToDelete.id,
        fileToDelete.storagePath,
        err,
      );
      setDeleteError(message);
      toast.error('Delete failed', message);
    } finally {
      setDeletingId(null);
    }
  };

  return {
    files,
    loading,
    isRetryingFiles,
    loadError,
    refetchFiles,
    validationErrors,
    setValidationErrors,
    actionError,
    setActionError,
    uploads,
    previewFile,
    setPreviewFile,
    fileToDelete,
    deleteError,
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
    requestDeleteFile,
    cancelDeleteFile,
    handleDeleteFile,
  };
}
