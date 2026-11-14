import {AlertCircle, Paperclip, Send, X} from 'lucide-react';
import {
  useRef,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {FILE_INPUT_ACCEPT, formatFileSize} from '@/utils/fileSharing';

export interface PendingAttachment {
  file: File;
  extension: string;
  resolvedMimeType: string;
}

interface MessageComposerProps {
  text: string;
  onTextChange: (value: string) => void;
  pendingAttachment: PendingAttachment | null;
  onClearAttachment: () => void;
  onCancelUpload: () => void;
  onSelectFile: (file: File) => void;
  onSubmit: (e?: FormEvent) => void;
  sending: boolean;
  uploadProgress: number | null;
  error: string | null;
  canDismissError: boolean;
  onDismissError: () => void;
}

export function MessageComposer({
  text,
  onTextChange,
  pendingAttachment,
  onClearAttachment,
  onCancelUpload,
  onSelectFile,
  onSubmit,
  sending,
  uploadProgress,
  error,
  canDismissError,
  onDismissError,
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (selected) {
      onSelectFile(selected);
    }
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 space-y-2.5"
    >
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-2 flex items-start justify-between gap-2 text-xs text-red-700 dark:text-red-300"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
          {canDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss error"
              className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {pendingAttachment && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {pendingAttachment.file.name}
              </span>
              <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                ({formatFileSize(pendingAttachment.file.size)})
              </span>
            </div>
            {sending ? (
              <button
                type="button"
                onClick={onCancelUpload}
                aria-label="Cancel attachment upload"
                className="px-2 py-0.5 rounded-md text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-950/50"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearAttachment}
                aria-label="Remove attachment"
                className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          {uploadProgress !== null && (
            <div className="h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-150"
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
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Attach file to message"
        />
        <button
          type="button"
          disabled={sending}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
          title="Attach file (max 25 MB)"
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
        >
          <Paperclip className="w-4 h-4" aria-hidden="true" />
        </button>

        <textarea
          rows={1}
          value={text}
          disabled={sending}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Write a message..."
          className="flex-1 min-h-[40px] max-h-32 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
        />

        <button
          type="submit"
          disabled={sending || (!text.trim() && !pendingAttachment)}
          aria-label="Send message"
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-colors shrink-0"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
        </button>
      </div>
    </form>
  );
}
