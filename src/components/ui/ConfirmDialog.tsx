import type {ReactNode} from 'react';
import {Button} from '@/components/ui/Button';
import {Modal} from '@/components/ui/Modal';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  titleId?: string;
  message: ReactNode;
  confirmLabel?: string;
  confirmBusyLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  titleId = 'confirm-dialog-title',
  message,
  confirmLabel = 'Confirm',
  confirmBusyLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId={titleId}
      title={title}
      maxWidthClass="max-w-md"
      disableClose={loading}
    >
      <div className="p-6 space-y-5">
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => void onConfirm()}
            loading={loading}
          >
            {loading && confirmBusyLabel ? confirmBusyLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
