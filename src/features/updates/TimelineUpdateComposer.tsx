import {zodResolver} from '@hookform/resolvers/zod';
import {ImagePlus, Send, X} from 'lucide-react';
import {useState, type ChangeEvent} from 'react';
import {useForm} from 'react-hook-form';
import {
  timelineUpdateFormSchema,
  type TimelineUpdateFormParsed,
  type TimelineUpdateFormValues,
} from '@/types/portal';
import {compressImageToDataUrl} from '@/utils/imageCompress';

interface TimelineUpdateComposerProps {
  onPostUpdate: (message: string, attachments: string[]) => Promise<void>;
}

export function TimelineUpdateComposer({onPostUpdate}: TimelineUpdateComposerProps) {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isCompressingImages, setIsCompressingImages] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<TimelineUpdateFormValues, unknown, TimelineUpdateFormParsed>({
    resolver: zodResolver(timelineUpdateFormSchema),
    defaultValues: {message: ''},
  });

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = 3 - attachments.length;
    if (remainingSlots <= 0) {
      setAttachmentError('You can attach up to 3 images per update.');
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setAttachmentError(`Only ${remainingSlots} more image(s) allowed (max 3 per update).`);
    }

    setIsCompressingImages(true);
    try {
      const encoded = await Promise.all(toProcess.map((f) => compressImageToDataUrl(f)));
      setAttachments((prev) => [...prev, ...encoded].slice(0, 3));
    } catch (err) {
      setAttachmentError(
        err instanceof Error ? err.message : 'Unable to attach one of the selected images.',
      );
    } finally {
      setIsCompressingImages(false);
    }
  };

  const handleValidSubmit = async (values: TimelineUpdateFormParsed) => {
    setAttachmentError(null);
    await onPostUpdate(values.message, attachments);
    reset({message: ''});
    setAttachments([]);
  };

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4"
      noValidate
    >
      <div>
        <label
          htmlFor="timeline-message"
          className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
        >
          Post Project Update
        </label>
        <textarea
          id="timeline-message"
          rows={3}
          {...register('message')}
          placeholder="Share progress, completed screens, staging links, or sprint notes with the client..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.message.message}</p>
        )}
      </div>

      {attachmentError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {attachmentError}
        </p>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {attachments.map((src, idx) => (
            <div
              key={`preview-${idx}`}
              className="relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950"
            >
              <img
                src={src}
                alt={`Attachment preview ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))
                }
                aria-label={`Remove attachment ${idx + 1}`}
                className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/75 text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
          <ImagePlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <span>
            {isCompressingImages ? 'Processing images...' : `Attach images (${attachments.length}/3)`}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            disabled={isCompressingImages || attachments.length >= 3}
            onChange={handleImageSelect}
            className="sr-only"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || isCompressingImages}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>{isSubmitting ? 'Posting...' : 'Post Update'}</span>
        </button>
      </div>
    </form>
  );
}
