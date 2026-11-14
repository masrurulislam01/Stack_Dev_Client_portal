import {Clock, Image as ImageIcon, Trash2, User} from 'lucide-react';
import {useState} from 'react';
import {EmptyState} from '@/components/ui';
import {TimelineLightboxModal} from '@/features/updates/TimelineLightboxModal';
import type {ProjectUpdateRecord} from '@/types/portal';
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
      <EmptyState
        icon={<Clock className="w-5 h-5" aria-hidden="true" />}
        title="No updates yet"
        description={emptyMessage}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {updates.map((update) => {
          const safeAttachments = update.attachments.filter(isSafeTimelineImageSrc);

          return (
            <article
              key={update.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <User
                      className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"
                      aria-hidden="true"
                    />
                    <span>{update.authorName || 'Stack Dev'}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <time className="tabular-nums">{formatDateTime(update.createdAt)}</time>
                </div>

                {onDeleteUpdate && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(update.id)}
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

              {safeAttachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {safeAttachments.map((src, idx) => (
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
          );
        })}
      </div>

      <TimelineLightboxModal imageSrc={lightboxImage} onClose={() => setLightboxImage(null)} />
    </>
  );
}
