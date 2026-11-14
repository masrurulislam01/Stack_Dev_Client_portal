import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import {cn} from '@/lib/cn';

export function Table({
  className,
  children,
  ...rest
}: TableHTMLAttributes<HTMLTableElement> & {children: ReactNode}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left border-collapse', className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement> & {children: ReactNode}) {
  return (
    <thead
      className={cn(
        'bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800',
        className,
      )}
      {...rest}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement> & {children: ReactNode}) {
  return (
    <tbody
      className={cn('divide-y divide-slate-200 dark:divide-slate-800', className)}
      {...rest}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement> & {children: ReactNode}) {
  return (
    <tr
      className={cn(
        'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className,
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & {children?: ReactNode}) {
  return (
    <th
      className={cn(
        'px-4 sm:px-5 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & {children?: ReactNode}) {
  return (
    <td className={cn('px-4 sm:px-5 py-3.5 text-sm', className)} {...rest}>
      {children}
    </td>
  );
}
