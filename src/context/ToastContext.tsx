import {AlertCircle, CheckCircle2, Info, X} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'error' | 'success' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastApi {
  show: (variant: ToastVariant, title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  success: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

export function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, title: string, description?: string): string => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev.slice(-4), {id, variant, title, description}]);

      const durationMs = variant === 'error' ? 7500 : 4500;
      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, durationMs);
      timersRef.current.set(id, timer);

      return id;
    },
    [],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      error: (title, description) => show('error', title, description),
      success: (title, description) => show('success', title, description),
      info: (title, description) => show('info', title, description),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

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
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="inline-flex items-center justify-center min-w-[32px] min-h-[32px] -mr-1.5 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
