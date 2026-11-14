export function Skeleton({className = ''}: {className?: string}) {
  return (
    <div
      className={`rounded-xl bg-slate-200/80 dark:bg-slate-800/80 animate-pulse ${className}`}
    />
  );
}

export function CardSkeleton({count = 3}: {count?: number}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({length: count}, (_, i) => i + 1).map((item) => (
        <div
          key={item}
          className="h-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse"
        />
      ))}
    </div>
  );
}

export function TableSkeleton({rows = 3, className = 'p-6 space-y-3'}: {rows?: number; className?: string}) {
  return (
    <div className={className}>
      {Array.from({length: rows}, (_, i) => i + 1).map((item) => (
        <div
          key={item}
          className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
        />
      ))}
    </div>
  );
}
