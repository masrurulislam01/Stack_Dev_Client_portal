import {AlertCircle, RefreshCw, X} from 'lucide-react';

export interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  message,
  onRetry,
  retrying = false,
  onDismiss,
  className = '',
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span className="break-words">{message}</span>
      </div>

      {(onRetry || onDismiss) && (
        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-xl border border-danger/30 bg-surface text-xs font-semibold text-danger-text hover:bg-danger/10 disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{retrying ? 'Retrying...' : 'Retry'}</span>
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="inline-flex items-center justify-center min-h-[36px] px-2 py-1 rounded-xl text-xs font-medium text-danger-text hover:bg-danger/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X className="w-3.5 h-3.5 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">Dismiss</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
