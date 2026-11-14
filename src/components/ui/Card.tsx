import type {HTMLAttributes, ReactNode} from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

export function Card({interactive = false, className = '', children, ...props}: CardProps) {
  return (
    <div
      className={`bg-surface rounded-2xl border border-border card-inset ${
        interactive
          ? 'transition-all duration-150 hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`px-6 py-4 border-b border-border ${className}`}>{children}</div>;
}

export function CardBody({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}
