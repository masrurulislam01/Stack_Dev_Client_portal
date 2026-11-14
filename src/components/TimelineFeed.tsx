import {Clock, Image as ImageIcon, Trash2, User, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import type {ProjectUpdateRecord} from '../types/portal';
import {formatDateTime} from '../utils/format';

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
  onDeleteUpdate?: (updateId: string) => Promise<void>;
  emptyMessage?: string;
}

export function TimelineFeed({
  updates,
  loading,
  onDeleteUpdate,
  emptyMessage = 'No timeline updates have been posted for this project yet.',
}: TimelineFeedProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxImage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxImage]);

  const handleDelete = async (id: string) => {
    if (!onDeleteUpdate) return;
    setDeletingId(id);
    try {
      await onDeleteUpdate(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-5 h-5" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          No updates yet
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {updates.map((update) => (
          <article
            key={update.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                  <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  <span>{update.authorName || 'Stack Dev'}</span>
                </span>
                <span aria-hidden="true">·</span>
                <time className="tabular-nums">{formatDateTime(update.createdAt)}</time>
              </div>

              {onDeleteUpdate && (
                <button
                  type="button"
                  onClick={() => handleDelete(update.id)}
                  disabled={deletingId === update.id}
                  aria-label="Delete update"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {update.message}
            </p>

            {update.attachments.filter(isSafeTimelineImageSrc).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {update.attachments.filter(isSafeTimelineImageSrc).map((src, idx) => (
                  <button
                    key={`${update.id}-att-${idx}`}
                    type="button"
                    onClick={() => setLightboxImage(src)}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 aspect-4/3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  >
                    <img
                      src={src}
                      alt={`Project update attachment ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                    <span className="sr-only">View attachment {idx + 1}</span>
                    <span className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
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
              className="absolute -top-12 right-0 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            <img
              src={lightboxImage}
              alt="Full size update attachment"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto max-w-full rounded-2xl border border-slate-800 shadow-2xl object-contain bg-slate-900"
            />
          </div>
        </div>
      )}
    </>
  );
}
