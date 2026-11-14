import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, ImagePlus, Send, X} from 'lucide-react';
import {useState, type ChangeEvent} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Textarea} from '@/components/ui';
import {getErrorMessage} from '@/services/serviceUtils';
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
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setSubmitError(null);
    try {
      await onPostUpdate(values.message, attachments);
      reset({message: ''});
      setAttachments([]);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to post update.'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="bg-surface rounded-2xl border border-border card-inset p-6 space-y-4"
      noValidate
    >
      <Textarea
        id="timeline-message"
        rows={3}
        label="Post Project Update"
        disabled={isSubmitting}
        error={errors.message?.message}
        {...register('message')}
        placeholder="Share progress, completed screens, staging links, or sprint notes with the client..."
      />

      {(attachmentError || submitError) && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-danger-text">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{submitError || attachmentError}</span>
        </p>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {attachments.map((src, idx) => (
            <div
              key={`preview-${idx}`}
              className="relative w-24 h-20 rounded-xl overflow-hidden border border-border bg-surface-muted"
            >
              <img
                src={src}
                alt={`Attachment preview ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))
                }
                aria-label={`Remove attachment ${idx + 1}`}
                className="absolute top-1 right-1 p-1 rounded-full bg-overlay text-white hover:bg-danger disabled:opacity-50 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
        <label
          className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl border border-border-strong bg-surface text-xs font-semibold text-foreground transition-colors ${
            isSubmitting || isCompressingImages || attachments.length >= 3
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-surface-muted cursor-pointer'
          }`}
        >
          <ImagePlus className="w-4 h-4 text-primary-600" aria-hidden="true" />
          <span>
            {isCompressingImages ? 'Processing images...' : `Attach images (${attachments.length}/3)`}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            disabled={isSubmitting || isCompressingImages || attachments.length >= 3}
            onChange={handleImageSelect}
            className="sr-only"
          />
        </label>

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting || isCompressingImages}
          icon={<Send className="w-4 h-4" aria-hidden="true" />}
        >
          {isSubmitting ? 'Posting...' : 'Post Update'}
        </Button>
      </div>
    </form>
  );
}
