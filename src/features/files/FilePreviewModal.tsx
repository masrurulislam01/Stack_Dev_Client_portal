import {Download, Loader2, X} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Button} from '@/components/ui';
import {FilePreviewBody} from '@/features/files/FilePreviewBody';
import {useEscapeKey} from '@/hooks/useEscapeKey';
import {useToast} from '@/hooks/useToast';
import {getSignedDownloadUrl, SIGNED_URL_EXPIRY_SECONDS} from '@/services/files';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ProjectFileRecord} from '@/types/portal';
import {
  formatFileSize,
  getFileTypeLabel,
  isTrustedStorageUrl,
  triggerFileDownload,
} from '@/utils/fileSharing';

interface FilePreviewModalProps {
  file: ProjectFileRecord | null;
  onClose: () => void;
}

export function FilePreviewModal({file, onClose}: FilePreviewModalProps) {
  const toast = useToast();
  const [signedUrl, setSignedUrl] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEscapeKey(Boolean(file), onClose);

  const loadSignedPreviewUrl = useCallback(
    async (target: ProjectFileRecord) => {
      setLoadingUrl(true);
      setPreviewError(null);
      setSignedUrl('');
      try {
        const freshUrl = await getSignedDownloadUrl(
          target.storagePath,
          SIGNED_URL_EXPIRY_SECONDS,
        );
        if (!isTrustedStorageUrl(freshUrl)) {
          throw new Error('Blocked untrusted file preview URL.');
        }
        setSignedUrl(freshUrl);
      } catch (err) {
        const message = getErrorMessage(
          err,
          'Unable to generate a temporary preview link for this file.',
        );
        console.error('[FilePreviewModal] Preview signed URL error:', target.storagePath, err);
        setPreviewError(message);
        toast.error('Preview failed', message);
      } finally {
        setLoadingUrl(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!file) {
      setSignedUrl('');
      setPreviewError(null);
      setLoadingUrl(false);
      return;
    }
    let cancelled = false;
    setLoadingUrl(true);
    setPreviewError(null);
    setSignedUrl('');

    void (async () => {
      try {
        const freshUrl = await getSignedDownloadUrl(
          file.storagePath,
          SIGNED_URL_EXPIRY_SECONDS,
        );
        if (cancelled) return;
        if (!isTrustedStorageUrl(freshUrl)) {
          throw new Error('Blocked untrusted file preview URL.');
        }
        setSignedUrl(freshUrl);
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(
          err,
          'Unable to generate a temporary preview link for this file.',
        );
        console.error('[FilePreviewModal] Preview signed URL error:', file.storagePath, err);
        setPreviewError(message);
        toast.error('Preview failed', message);
      } finally {
        if (!cancelled) setLoadingUrl(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, toast]);

  if (!file) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const freshUrl = await getSignedDownloadUrl(
        file.storagePath,
        SIGNED_URL_EXPIRY_SECONDS,
      );
      await triggerFileDownload(freshUrl, file.name);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to download this file.');
      console.error('[FilePreviewModal] Download error:', file.storagePath, err);
      toast.error('Download failed', message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-overlay backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-preview-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[880px] bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-lg overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h3
              id="file-preview-title"
              className="font-heading text-sm sm:text-base font-semibold text-foreground truncate"
            >
              {file.name || 'Untitled file'}
            </h3>
            <p className="text-xs text-muted mt-0.5 num">
              {getFileTypeLabel(file.extension ?? '', file.mimeType ?? '')} ·{' '}
              {formatFileSize(file.size)} · Uploaded by {file.uploadedByName || 'Team member'} ·
              Link valid for 60s
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={downloading}
              onClick={() => void handleDownload()}
              icon={
                downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                )
              }
            >
              {downloading ? 'Preparing...' : 'Download'}
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close file preview"
              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <FilePreviewBody
          file={file}
          signedUrl={signedUrl}
          loadingUrl={loadingUrl}
          previewError={previewError}
          onRefreshUrl={() => void loadSignedPreviewUrl(file)}
          onImageError={() => {
            const msg = 'Image preview failed to load or the 60-second link expired.';
            console.error('[FilePreviewModal] <img> failed to load signed URL for:', file.storagePath);
            setPreviewError(msg);
            toast.error('Preview failed', msg);
          }}
        />
      </div>
    </div>
  );
}
