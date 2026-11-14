import type {ReactNode} from 'react';

export function TableContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">{children}</table>
      </div>
    </div>
  );
}

export function TableHead({children}: {children: ReactNode}) {
  return (
    <thead>
      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <th className={`py-3.5 px-6 ${className}`}>{children}</th>;
}
