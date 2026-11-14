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
  maxWidthClass = 'max-w-[520px]',
  zIndexClass = 'z-50',
  disableClose = false,
  headerRight,
  children,
}: ModalProps) {
  useEscapeKey(open && !disableClose, onClose);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-end sm:items-center justify-center p-0 sm:p-4 bg-overlay backdrop-blur-[6px] overflow-y-auto`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`w-full ${maxWidthClass} sm:my-auto bg-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-lg overflow-hidden max-h-[92vh] flex flex-col`}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-heading text-lg font-semibold text-foreground truncate"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              disabled={disableClose}
              aria-label="Close modal"
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-muted hover:text-foreground hover:bg-surface-muted disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
