import {AlertCircle, ExternalLink, Loader2, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui';
import type {ProjectFileRecord} from '@/types/portal';
import {isImageExtension, isPdfFile, isTrustedStorageUrl} from '@/utils/fileSharing';

interface FilePreviewBodyProps {
  file: ProjectFileRecord;
  signedUrl: string;
  loadingUrl: boolean;
  previewError: string | null;
  onRefreshUrl: () => void;
  onImageError: () => void;
}

export function FilePreviewBody({
  file,
  signedUrl,
  loadingUrl,
  previewError,
  onRefreshUrl,
  onImageError,
}: FilePreviewBodyProps) {
  const isImage = isImageExtension(file.extension, file.mimeType);
  const isPdf = isPdfFile(file.extension, file.mimeType);
  const safeSignedUrl = signedUrl && isTrustedStorageUrl(signedUrl) ? signedUrl : '';

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-surface-muted flex flex-col items-center justify-center min-h-[320px]">
      {loadingUrl ? (
        <div className="flex flex-col items-center gap-2 text-muted">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <p className="text-xs font-medium">Generating secure 60-second preview link...</p>
        </div>
      ) : previewError || !safeSignedUrl ? (
        <div className="max-w-md text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-xl bg-danger-soft text-danger-text flex items-center justify-center">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-danger-text">
            {previewError || 'This file link has expired or could not be loaded.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRefreshUrl}
            icon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            Refresh Preview Link
          </Button>
        </div>
      ) : isImage ? (
        <img
          src={safeSignedUrl}
          alt={file.name}
          referrerPolicy="no-referrer"
          onError={onImageError}
          className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-sm"
        />
      ) : isPdf ? (
        <div className="w-full flex flex-col gap-3">
          <iframe
            src={safeSignedUrl}
            title={file.name}
            referrerPolicy="no-referrer"
            className="w-full h-[70vh] rounded-xl border border-border bg-white"
          />
          <div className="flex justify-end">
            <a
              href={safeSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open PDF in a new tab</span>
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Preview is not available for this file type. Use the Download button above to save it.
        </p>
      )}
    </div>
  );
}
