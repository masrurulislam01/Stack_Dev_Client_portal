import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertCircle,
  Download,
  Eye,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {useEffect, useRef, useState, type ChangeEvent, type DragEvent} from 'react';
import type {PortalUser} from '../context/AuthContext';
import {useToast} from '../context/ToastContext';
import {queryKeys} from '../lib/queryKeys';
import {
  create as uploadProjectFile,
  getSignedDownloadUrl,
  list as listProjectFiles,
  remove as deleteProjectFile,
  SIGNED_URL_EXPIRY_SECONDS,
  UploadCancelledError,
} from '../services/files';
import {getErrorMessage} from '../services/serviceUtils';
import type {ProjectFileRecord, ProjectRecord} from '../types/portal';
import {
  FILE_INPUT_ACCEPT,
  formatFileSize,
  getFileTypeLabel,
  isImageExtension,
  isPdfFile,
  isPreviewableFile,
  triggerFileDownload,
  validateProjectFile,
} from '../utils/fileSharing';
import {formatDateTime} from '../utils/format';
import {FilePreviewModal} from './FilePreviewModal';

interface ProjectFilesTabProps {
  project: ProjectRecord;
  user: PortalUser;
}

interface ActiveUploadItem {
  id: string;
  file: File;
  mimeType: string;
  fileName: string;
  totalBytes: number;
  loadedBytes: number;
  progress: number;
  status: 'uploading' | 'saving' | 'error' | 'cancelled';
  errorMessage?: string;
}

function FileCategoryIcon({extension, mimeType}: {extension: string; mimeType: string}) {
  const ext = extension.toLowerCase();
  if (isImageExtension(ext, mimeType)) {
    return (
      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
        <FileImage className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (isPdfFile(ext, mimeType)) {
    return (
      <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (ext === 'zip') {
    return (
      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
        <FileArchive className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (ext === 'xls' || ext === 'xlsx') {
    return (
      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
        <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
      <File className="w-4 h-4" aria-hidden="true" />
    </div>
  );
}

export function ProjectFilesTab({project, user}: ProjectFilesTabProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<ActiveUploadItem[]>([]);
  const [previewFile, setPreviewFile] = useState<ProjectFileRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);
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
            ? {
                ...item,
                progress: 0,
                loadedBytes: 0,
                status: 'uploading',
                errorMessage: undefined,
              }
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
              ? {
                  ...item,
                  status: 'cancelled',
                  errorMessage: 'Upload cancelled.',
                }
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
          item.id === uploadId
            ? {
                ...item,
                status: 'error',
                errorMessage: message,
              }
            : item,
        ),
      );
    } finally {
      abortControllersRef.current.delete(uploadId);
    }
  };

  const handleCancelUpload = (uploadId: string) => {
    const controller = abortControllersRef.current.get(uploadId);
    if (controller) {
      controller.abort();
    }
  };

  const handleRetryUpload = (item: ActiveUploadItem) => {
    if (item.status === 'uploading' || item.status === 'saving') return;
    void runFileUpload(item.id, item.file, item.mimeType, true);
  };

  const handleDismissUpload = (uploadId: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== uploadId));
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

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleSelectedFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFiles(e.dataTransfer.files);
    }
  };

  const canDeleteFile = (file: ProjectFileRecord): boolean => {
    if (user.role === 'admin') return true;
    return file.uploadedByUid === user.id;
  };

  const handleDownloadFile = async (file: ProjectFileRecord) => {
    setActionError(null);
    setDownloadingId(file.id);
    try {
      const freshUrl = await getSignedDownloadUrl(
        file.storagePath,
        SIGNED_URL_EXPIRY_SECONDS,
      );
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
      if (previewFile?.id === file.id) {
        setPreviewFile(null);
      }
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

  return (
    <div className="space-y-6">
      {/* Drag & Drop Uploader */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/40'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={FILE_INPUT_ACCEPT}
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Upload project files"
        />
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
          {isDragging ? 'Drop files to upload' : 'Upload files to this project'}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Drag and drop multiple files here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
          >
            browse from your device
          </button>
          .
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Allowed: Images (PNG, JPG, GIF, WebP, BMP, HEIC), PDF, ZIP, DOC/DOCX, XLS/XLSX · Max 25 MB per file
        </p>
      </div>

      {/* Validation / Rejection Banner */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <ul className="space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setValidationErrors([])}
            aria-label="Dismiss file validation errors"
            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {(actionError || loadError) && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {actionError ||
                (loadError instanceof Error ? loadError.message : 'Unable to load shared files.')}
            </span>
          </div>
          {actionError && (
            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Dismiss error"
              className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Active Upload Progress List */}
      {uploads.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Uploads ({uploads.length})
          </h4>
          <ul className="space-y-3">
            {uploads.map((item) => {
              const isFailedOrCancelled =
                item.status === 'error' || item.status === 'cancelled';

              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.fileName}
                      </p>
                      <p
                        className={`text-xs tabular-nums ${
                          item.status === 'error'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.status === 'saving'
                          ? 'Saving file record...'
                          : item.status === 'error' || item.status === 'cancelled'
                            ? item.errorMessage
                            : `Uploading (${formatFileSize(item.loadedBytes)} / ${formatFileSize(item.totalBytes)}) · ${item.progress}%`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === 'uploading' && (
                        <button
                          type="button"
                          onClick={() => handleCancelUpload(item.id)}
                          aria-label={`Cancel upload for ${item.fileName}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {isFailedOrCancelled && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRetryUpload(item)}
                            aria-label={`Retry upload for ${item.fileName}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Retry</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissUpload(item.id)}
                            aria-label={`Dismiss ${item.fileName}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {!isFailedOrCancelled && (
                    <div
                      role="progressbar"
                      aria-valuenow={item.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Upload progress for ${item.fileName}`}
                      className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
                    >
                      <div
                        className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-150"
                        style={{width: `${item.progress}%`}}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Files List */}
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
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="p-10 text-center">
            <FolderOpen
              className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No files uploaded yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Drag and drop PDFs, documents, spreadsheets, archives, or images above to share them with the project team.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-6">File Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploader</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {files.map((file) => {
                    const previewable = isPreviewableFile(file.extension, file.mimeType);
                    const deletable = canDeleteFile(file);
                    const isConfirming = confirmDeleteId === file.id;
                    const isDeleting = deletingId === file.id;
                    const isDownloading = downloadingId === file.id;

                    return (
                      <tr
                        key={file.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3 min-w-0 max-w-xs">
                            <FileCategoryIcon
                              extension={file.extension}
                              mimeType={file.mimeType}
                            />
                            <div className="min-w-0">
                              <p
                                title={file.name}
                                className="font-medium text-slate-900 dark:text-slate-100 truncate"
                              >
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                                .{file.extension || 'file'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {getFileTypeLabel(file.extension, file.mimeType)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 dark:text-slate-100 font-medium">
                              {file.uploadedByName}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                file.uploadedByRole === 'admin'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/60'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {file.uploadedByRole === 'admin' ? 'Admin' : 'Client'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                          {formatDateTime(file.createdAt)}
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          {isConfirming ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteFile(file)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                              >
                                {isDeleting ? 'Deleting...' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              {previewable && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(file)}
                                  aria-label={`Preview ${file.name}`}
                                  title="Preview"
                                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                >
                                  <Eye className="w-4 h-4" aria-hidden="true" />
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={() => void handleDownloadFile(file)}
                                aria-label={`Download ${file.name}`}
                                title="Download"
                                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-50 transition-colors"
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
                                  onClick={() => setConfirmDeleteId(file.id)}
                                  aria-label={`Delete ${file.name}`}
                                  title="Delete"
                                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <ul className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {files.map((file) => {
                const previewable = isPreviewableFile(file.extension, file.mimeType);
                const deletable = canDeleteFile(file);
                const isConfirming = confirmDeleteId === file.id;
                const isDeleting = deletingId === file.id;
                const isDownloading = downloadingId === file.id;

                return (
                  <li key={file.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <FileCategoryIcon extension={file.extension} mimeType={file.mimeType} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                          {getFileTypeLabel(file.extension, file.mimeType)} · {formatFileSize(file.size)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {file.uploadedByName} ({file.uploadedByRole === 'admin' ? 'Admin' : 'Client'}) ·{' '}
                          {formatDateTime(file.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {previewable && (
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Preview</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isDownloading}
                        onClick={() => void handleDownloadFile(file)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{isDownloading ? 'Preparing...' : 'Download'}</span>
                      </button>

                      {deletable &&
                        (isConfirming ? (
                          <div className="inline-flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteFile(file)}
                              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(file.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
