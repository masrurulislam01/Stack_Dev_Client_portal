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
      className={`bg-surface rounded-2xl border border-border card-inset overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">{children}</table>
      </div>
    </div>
  );
}

export function TableHead({children}: {children: ReactNode}) {
  return (
    <thead className="sticky top-0 z-10 bg-surface-muted">
      <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({
  children,
  align = 'left',
  className = '',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : '';
  return (
    <th className={`py-3.5 px-6 whitespace-nowrap ${alignClass} ${className}`}>
      {children}
    </th>
  );
}
