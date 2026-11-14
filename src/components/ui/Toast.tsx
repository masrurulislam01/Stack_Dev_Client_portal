import {AlertCircle, CheckCircle2, Info, X} from 'lucide-react';
import type {ToastItem} from '@/hooks/useToast';

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-20 sm:bottom-auto sm:top-5 right-4 sm:right-5 z-[60] flex flex-col gap-2.5 w-[calc(100vw-2rem)] sm:w-full max-w-sm pointer-events-none"
    >
      {toasts.map((item) => {
        const isError = item.variant === 'error';
        const isSuccess = item.variant === 'success';
        return (
          <div
            key={item.id}
            role={isError ? 'alert' : 'status'}
            className={`pointer-events-auto rounded-2xl border border-border bg-surface-raised text-foreground shadow-md px-4 py-3.5 flex items-start gap-3 transition-all border-l-4 ${
              isError
                ? 'border-l-danger'
                : isSuccess
                  ? 'border-l-success'
                  : 'border-l-primary-600'
            }`}
          >
            <div
              className={`mt-0.5 shrink-0 ${
                isError
                  ? 'text-danger-text'
                  : isSuccess
                    ? 'text-success-text'
                    : 'text-primary-600'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Info className="w-4 h-4" aria-hidden="true" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug break-words">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-xs text-muted break-words">{item.description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="Dismiss notification"
              className="inline-flex items-center justify-center min-w-[32px] min-h-[32px] -mr-1.5 -mt-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
