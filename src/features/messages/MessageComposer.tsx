import {AlertCircle, Paperclip, Send, X} from 'lucide-react';
import type {ChangeEvent, FormEvent, KeyboardEvent, RefObject} from 'react';
import {Button} from '@/components/ui';
import type {PendingAttachment} from '@/features/messages/messageHelpers';
import {FILE_INPUT_ACCEPT, formatFileSize} from '@/utils/fileSharing';

interface MessageComposerProps {
  text: string;
  onTextChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: FormEvent) => void;
  sending: boolean;
  pendingAttachment: PendingAttachment | null;
  uploadProgress: number | null;
  onClearAttachment: () => void;
  onAbortUpload: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  combinedError: string | null;
  hasLocalError: boolean;
  onClearError: () => void;
}

export function MessageComposer({
  text,
  onTextChange,
  onKeyDown,
  onSubmit,
  sending,
  pendingAttachment,
  uploadProgress,
  onClearAttachment,
  onAbortUpload,
  fileInputRef,
  onFileInputChange,
  combinedError,
  hasLocalError,
  onClearError,
}: MessageComposerProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 border-t border-border bg-surface p-3 sm:p-4 space-y-2.5"
    >
      {combinedError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 flex items-start justify-between gap-2 text-xs text-danger-text"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" aria-hidden="true" />
            <span>{combinedError}</span>
          </div>
          {hasLocalError && (
            <button
              type="button"
              onClick={onClearError}
              aria-label="Dismiss error"
              className="p-0.5 rounded hover:bg-danger/15 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {pendingAttachment && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="w-3.5 h-3.5 text-primary-600 shrink-0" />
              <span className="font-semibold text-foreground truncate">
                {pendingAttachment.file.name}
              </span>
              <span className="text-muted num shrink-0">
                ({formatFileSize(pendingAttachment.file.size)})
              </span>
            </div>
            {sending ? (
              <button
                type="button"
                onClick={onAbortUpload}
                aria-label="Cancel attachment upload"
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-danger-text hover:bg-danger-soft cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearAttachment}
                aria-label="Remove attachment"
                className="p-1 rounded-lg text-muted hover:text-danger-text cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          {uploadProgress !== null && (
            <div className="h-1.5 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all duration-150"
                style={{width: `${uploadProgress}%`}}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_INPUT_ACCEPT}
          onChange={onFileInputChange}
          className="sr-only"
          aria-label="Attach file to message"
        />
        <button
          type="button"
          disabled={sending}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
          title="Attach file (max 25 MB)"
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-border-strong bg-surface text-muted hover:text-foreground hover:bg-surface-muted disabled:opacity-50 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <Paperclip className="w-4 h-4" aria-hidden="true" />
        </button>

        <textarea
          rows={1}
          value={text}
          disabled={sending}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message..."
          className="flex-1 min-h-[44px] max-h-32 px-3.5 py-2.5 rounded-xl border border-border bg-surface-muted text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:bg-surface focus:border-primary-600 focus:ring-[3px] focus:ring-ring resize-y"
        />

        <Button
          type="submit"
          variant="primary"
          disabled={sending || (!text.trim() && !pendingAttachment)}
          aria-label="Send message"
          icon={<Send className="w-4 h-4" aria-hidden="true" />}
          className="shrink-0"
        >
          <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
        </Button>
      </div>
    </form>
  );
}
