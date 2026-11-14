export function Skeleton({className = ''}: {className?: string}) {
  return <div className={`rounded-xl skeleton-shimmer ${className}`} />;
}

export function CardSkeleton({count = 3}: {count?: number}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({length: count}, (_, i) => i + 1).map((item) => (
        <div
          key={item}
          className="h-48 rounded-2xl border border-border bg-surface card-inset p-6 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/5 rounded-lg skeleton-shimmer" />
              <div className="h-3 w-2/5 rounded-lg skeleton-shimmer" />
            </div>
            <div className="h-6 w-20 rounded-full skeleton-shimmer shrink-0" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full skeleton-shimmer" />
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded-lg skeleton-shimmer" />
              <div className="h-3 w-16 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 3,
  className = 'p-6 space-y-3',
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({length: rows}, (_, i) => i + 1).map((item) => (
        <div
          key={item}
          className="h-14 rounded-xl skeleton-shimmer"
        />
      ))}
    </div>
  );
}
