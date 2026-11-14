import type {HTMLAttributes, ReactNode} from 'react';
import {cn} from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({className, children, ...rest}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({className, children, ...rest}: CardProps) {
  return (
    <div
      className={cn(
        'px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardContent({className, children, ...rest}: CardProps) {
  return (
    <div className={cn('p-5 sm:p-6', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({className, children, ...rest}: CardProps) {
  return (
    <div
      className={cn(
        'px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
