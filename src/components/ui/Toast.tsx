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
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2.5 w-[calc(100vw-2rem)] sm:w-full max-w-sm pointer-events-none"
    >
      {toasts.map((item) => {
        const isError = item.variant === 'error';
        const isSuccess = item.variant === 'success';
        return (
          <div
            key={item.id}
            role={isError ? 'alert' : 'status'}
            className={`pointer-events-auto rounded-2xl border shadow-lg px-4 py-3.5 flex items-start gap-3 transition-all ${
              isError
                ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/70 text-slate-900 dark:text-slate-100'
                : isSuccess
                  ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/70 text-slate-900 dark:text-slate-100'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
            }`}
          >
            <div
              className={`mt-0.5 shrink-0 ${
                isError
                  ? 'text-red-600 dark:text-red-400'
                  : isSuccess
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400'
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
              <p className="text-xs sm:text-sm font-semibold leading-snug break-words">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 break-words">
                  {item.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="Dismiss notification"
              className="inline-flex items-center justify-center min-w-[32px] min-h-[32px] -mr-1.5 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
