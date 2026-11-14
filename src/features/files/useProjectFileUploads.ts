import {useQueryClient} from '@tanstack/react-query';
import {useEffect, useRef, useState} from 'react';
import type {PortalUser} from '@/features/auth/AuthContext';
import type {ActiveUploadItem} from '@/features/files/FileUploadQueue';
import {useToast} from '@/hooks';
import {queryKeys} from '@/lib/queryKeys';
import {create as uploadProjectFile, UploadCancelledError} from '@/services/files';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ProjectRecord} from '@/types/portal';
import {validateProjectFile} from '@/utils/fileSharing';

export function useProjectFileUploads(project: ProjectRecord, user: PortalUser) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [uploads, setUploads] = useState<ActiveUploadItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    const controllers = abortControllersRef.current;
    return () => {
      for (const controller of controllers.values()) controller.abort();
      controllers.clear();
    };
  }, []);

  const runFileUpload = async (uploadId: string, file: File, resolvedMimeType: string, isRetry = false) => {
    const controller = new AbortController();
    abortControllersRef.current.set(uploadId, controller);

    if (isRetry) {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === uploadId ? {...item, progress: 0, loadedBytes: 0, status: 'uploading', errorMessage: undefined} : item,
        ),
      );
    } else {
      setUploads((prev) => [
        ...prev,
        {id: uploadId, file, mimeType: resolvedMimeType, fileName: file.name, totalBytes: file.size, loadedBytes: 0, progress: 0, status: 'uploading'},
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
                ? {...item, progress: pct, loadedBytes: loadedBytes ?? item.loadedBytes, status: pct >= 96 ? 'saving' : 'uploading'}
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
          prev.map((item) => (item.id === uploadId ? {...item, status: 'cancelled', errorMessage: 'Upload cancelled.'} : item)),
        );
        toast.info('Upload cancelled', `"${file.name}" upload was cancelled.`);
        return;
      }
      const message = getErrorMessage(err, 'Upload failed. Please try again.');
      console.error('[ProjectFilesTab] Upload failed for file:', file.name, err);
      toast.error(`Failed to upload ${file.name}`, message);
      setUploads((prev) =>
        prev.map((item) => (item.id === uploadId ? {...item, status: 'error', errorMessage: message} : item)),
      );
    } finally {
      abortControllersRef.current.delete(uploadId);
    }
  };

  const handleSelectedFiles = (fileList: FileList | File[]) => {
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

  return {
    uploads,
    validationErrors,
    clearValidationErrors: () => setValidationErrors([]),
    handleSelectedFiles,
    cancelUpload: (uploadId: string) => abortControllersRef.current.get(uploadId)?.abort(),
    retryUpload: (item: ActiveUploadItem) => {
      if (item.status !== 'uploading' && item.status !== 'saving') {
        void runFileUpload(item.id, item.file, item.mimeType, true);
      }
    },
    dismissUpload: (uploadId: string) => setUploads((prev) => prev.filter((item) => item.id !== uploadId)),
  };
}
