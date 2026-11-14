import type {ReactNode} from 'react';

export type BadgeTone =
  | 'neutral'
  | 'indigo'
  | 'violet'
  | 'amber'
  | 'emerald'
  | 'red'
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'gold';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-muted border border-border',
  indigo: 'bg-primary-50 text-primary-700 border border-primary-200',
  primary: 'bg-primary-50 text-primary-700 border border-primary-200',
  violet: 'bg-primary-50 text-primary-700 border border-primary-200',
  info: 'bg-info-soft text-info-text border border-info/25',
  amber: 'bg-warning-soft text-warning-text border border-warning/25',
  warning: 'bg-warning-soft text-warning-text border border-warning/25',
  emerald: 'bg-success-soft text-success-text border border-success/25',
  success: 'bg-success-soft text-success-text border border-success/25',
  red: 'bg-danger-soft text-danger-text border border-danger/25',
  danger: 'bg-danger-soft text-danger-text border border-danger/25',
  gold: 'bg-accent-gold-soft text-foreground border border-accent-gold/30',
};

const TONE_DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-subtle',
  indigo: 'bg-primary-600',
  primary: 'bg-primary-600',
  violet: 'bg-primary-600',
  info: 'bg-info',
  amber: 'bg-warning',
  warning: 'bg-warning',
  emerald: 'bg-success',
  success: 'bg-success',
  red: 'bg-danger',
  danger: 'bg-danger',
  gold: 'bg-accent-gold',
};

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  dotClassName?: string;
  className?: string;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  dot = false,
  dotClassName,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold leading-5 whitespace-nowrap ${
        className ?? TONE_CLASSES[tone]
      }`}
    >
      {(dot || dotClassName) && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClassName ?? TONE_DOT_CLASSES[tone]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
