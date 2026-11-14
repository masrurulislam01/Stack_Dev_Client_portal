import {AlertCircle, ExternalLink, Loader2, RefreshCw} from 'lucide-react';
import type {ProjectFileRecord} from '@/types/portal';
import {isImageExtension, isPdfFile} from '@/utils/fileSharing';

interface FilePreviewContentProps {
  file: ProjectFileRecord;
  signedUrl: string;
  loadingUrl: boolean;
  previewError: string | null;
  onRefresh: () => void;
  onImageError: () => void;
}

export function FilePreviewContent({
  file,
  signedUrl,
  loadingUrl,
  previewError,
  onRefresh,
  onImageError,
}: FilePreviewContentProps) {
  const isImage = isImageExtension(file.extension, file.mimeType);
  const isPdf = isPdfFile(file.extension, file.mimeType);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[320px]">
      {loadingUrl ? (
        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs font-medium">Generating secure 60-second preview link...</p>
        </div>
      ) : previewError || !signedUrl ? (
        <div className="max-w-md text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {previewError || 'This file link has expired or could not be loaded.'}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Refresh Preview Link</span>
          </button>
        </div>
      ) : isImage ? (
        <img
          src={signedUrl}
          alt={file.name}
          referrerPolicy="no-referrer"
          onError={onImageError}
          className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-sm"
        />
      ) : isPdf ? (
        <div className="w-full flex flex-col gap-3">
          <iframe
            src={signedUrl}
            title={file.name}
            className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
          />
          <div className="flex justify-end">
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open PDF in a new tab</span>
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Preview is not available for this file type. Use the Download button above to save it.
        </p>
      )}
    </div>
  );
}
