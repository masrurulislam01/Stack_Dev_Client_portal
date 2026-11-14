import {Bell} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {ProjectUpdateRecord} from '@/types/portal';
import {formatTimestamp} from '@/utils/format';

export interface RecentUpdatesListProps {
  updates: ProjectUpdateRecord[];
  loading: boolean;
}

export function RecentUpdatesList({updates, loading}: RecentUpdatesListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Recent Updates
        </h3>
        {!loading && updates.length > 0 && (
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Latest {updates.length}
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 animate-pulse">
            {[1, 2, 3].map((row) => (
              <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-72 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200/70 dark:border-slate-700/70">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No recent updates yet
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              As our engineering team ships milestones or updates project status, your 5 latest
              updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {updates.map((update) => (
              <li
                key={update.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/35 transition-colors duration-150"
              >
                <div className="min-w-0 max-w-3xl">
                  <Link
                    to={`/projects/${update.projectId}`}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {update.projectTitle}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {update.message}
                  </p>
                </div>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                  {formatTimestamp(update.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
