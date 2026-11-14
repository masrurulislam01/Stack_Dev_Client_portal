import type {ReactNode} from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`bg-surface rounded-2xl border border-border card-inset px-6 py-12 text-center space-y-3.5 ${className}`}
    >
      {icon && (
        <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="pt-1.5">{action}</div>}
    </div>
  );
}
