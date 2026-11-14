import {X} from 'lucide-react';
import type {ReactNode} from 'react';
import {useEscapeKey} from '@/hooks/useEscapeKey';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  zIndexClass?: string;
  disableClose?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  titleId,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  zIndexClass = 'z-50',
  disableClose = false,
  headerRight,
  children,
}: ModalProps) {
  useEscapeKey(open && !disableClose, onClose);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px] overflow-y-auto`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`w-full ${maxWidthClass} my-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden`}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              disabled={disableClose}
              aria-label="Close modal"
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
