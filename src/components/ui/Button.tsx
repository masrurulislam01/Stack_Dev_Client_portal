import {Loader2} from 'lucide-react';
import type {ButtonHTMLAttributes, ReactNode} from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-brand text-white hover:brightness-110 hover:shadow-brand border border-transparent',
  secondary:
    'bg-surface border border-border-strong text-foreground hover:bg-surface-muted shadow-xs',
  outline:
    'bg-surface border border-border-strong text-foreground hover:bg-surface-muted shadow-xs',
  ghost:
    'bg-transparent text-body hover:bg-surface-muted hover:text-foreground',
  danger:
    'bg-danger-soft text-danger-text border border-danger/25 hover:bg-danger hover:text-white hover:border-danger',
  success:
    'bg-success text-white hover:brightness-110 border border-transparent shadow-xs',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-xl',
  md: 'min-h-[44px] px-4 py-2.5 text-sm rounded-xl',
  lg: 'min-h-[52px] px-5 py-3 text-sm rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
