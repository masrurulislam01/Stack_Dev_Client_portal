import {cn} from '@/lib/cn';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({className}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800',
        className,
      )}
    />
  );
}

export function CardSkeleton({count = 3, columnsClass = 'md:grid-cols-3'}: {count?: number; columnsClass?: string}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:gap-5', columnsClass)}>
      {Array.from({length: count}).map((_, idx) => (
        <div
          key={idx}
          className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
        />
      ))}
    </div>
  );
}

export function TableSkeleton({heightClass = 'h-64'}: {heightClass?: string}) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse',
        heightClass,
      )}
    />
  );
}
