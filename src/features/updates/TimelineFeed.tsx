import {Clock, Image as ImageIcon, Trash2, X} from 'lucide-react';
import {useState, type ReactNode} from 'react';
import {Card, ConfirmDialog, EmptyState, ErrorAlert} from '@/components/ui';
import {useEscapeKey} from '@/hooks/useEscapeKey';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ProjectUpdateRecord} from '@/types/portal';
import {getAvatarToneClass, getInitials} from '@/utils/avatar';
import {formatDateTime} from '@/utils/format';

function isSafeTimelineImageSrc(src: string): boolean {
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src)) {
    return true;
  }
  try {
    const parsed = new URL(src);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface TimelineFeedProps {
  updates: ProjectUpdateRecord[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
  onDeleteUpdate?: (updateId: string) => Promise<void>;
  emptyMessage?: string;
  emptyAction?: ReactNode;
}

export function TimelineFeed({
  updates,
  loading,
  error = null,
  onRetry,
  retrying = false,
  onDeleteUpdate,
  emptyMessage = 'No timeline updates have been posted for this project yet.',
  emptyAction,
}: TimelineFeedProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [pendingDeleteUpdate, setPendingDeleteUpdate] = useState<ProjectUpdateRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEscapeKey(Boolean(lightboxImage), () => setLightboxImage(null));

  const handleConfirmDelete = async () => {
    if (!onDeleteUpdate || !pendingDeleteUpdate) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await onDeleteUpdate(pendingDeleteUpdate.id);
      setPendingDeleteUpdate(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Unable to delete update.'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
                <div className="h-4 w-36 rounded skeleton-shimmer" />
              </div>
              <div className="h-3 w-28 rounded skeleton-shimmer" />
            </div>
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-2/3 rounded skeleton-shimmer" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={onRetry} retrying={retrying} />;
  }

  if (updates.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-5 h-5" aria-hidden="true" />}
        title="No updates yet"
        description={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <>
      <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-[15px] sm:before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-border">
        {updates.map((update) => {
          const safeAttachments = Array.isArray(update.attachments)
            ? update.attachments.filter(isSafeTimelineImageSrc)
            : [];
          const authorName = update.authorName || 'Stack Dev';

          return (
            <div key={update.id} className="relative">
              <div
                className={`absolute -left-6 sm:-left-8 top-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-background ${getAvatarToneClass(
                  authorName,
                )}`}
                aria-hidden="true"
              >
                {getInitials(authorName)}
              </div>

              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                    <span className="font-semibold text-foreground text-sm">{authorName}</span>
                    <span aria-hidden="true">·</span>
                    <time className="num">{formatDateTime(update.createdAt)}</time>
                  </div>

                  {onDeleteUpdate && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDeleteUpdate(update);
                      }}
                      aria-label="Delete update"
                      className="p-2 rounded-xl text-muted hover:text-danger-text hover:bg-danger-soft transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">
                  {update.message || ''}
                </p>

                {safeAttachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {safeAttachments.map((src, idx) => (
                      <button
                        key={`${update.id}-att-${idx}`}
                        type="button"
                        onClick={() => setLightboxImage(src)}
                        className="group relative rounded-xl overflow-hidden border border-border bg-surface-muted aspect-4/3 cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                      >
                        <img
                          src={src}
                          alt={`Project update attachment ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <span className="sr-only">View attachment {idx + 1}</span>
                        <span className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-overlay text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-[6px]"
          role="dialog"
          aria-modal="true"
          aria-label="Image attachment preview"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close image preview"
              className="absolute -top-12 right-0 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl bg-surface-raised border border-border text-foreground hover:bg-surface-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            <img
              src={lightboxImage}
              alt="Full size update attachment"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto max-w-full rounded-2xl border border-border shadow-lg object-contain bg-surface"
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteUpdate)}
        title="Delete Update"
        titleId="delete-update-title"
        message="Are you sure you want to delete this timeline update? Clients will no longer see it."
        confirmLabel="Delete"
        confirmBusyLabel="Deleting..."
        loading={isDeleting}
        error={deleteError}
        onClose={() => {
          setDeleteError(null);
          setPendingDeleteUpdate(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
