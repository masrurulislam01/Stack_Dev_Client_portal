import {ArrowRight, Bell} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {ProjectUpdateRecord} from '@/types/portal';
import {formatTimestamp} from '@/utils/format';

interface ClientRecentUpdatesCardProps {
  loading: boolean;
  updates: ProjectUpdateRecord[];
}

export function ClientRecentUpdatesCard({loading, updates}: ClientRecentUpdatesCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Recent Updates
        </h3>
        {!loading && updates.length > 0 && (
          <span className="font-mono text-xs text-muted num">Latest {updates.length}</span>
        )}
      </div>

      <div className="bg-surface rounded-2xl border border-border card-inset overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((row) => (
              <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-44 rounded-lg skeleton-shimmer" />
                  <div className="h-3 w-72 rounded-lg skeleton-shimmer" />
                </div>
                <div className="h-3 w-20 rounded-lg skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </div>
            <h4 className="font-heading text-base font-semibold text-foreground">
              No recent updates yet
            </h4>
            <p className="mt-1 text-sm text-muted max-w-md mx-auto leading-relaxed">
              As our engineering team ships milestones or updates project status, your 5 latest
              updates will appear here.
            </p>
            <Link
              to="/projects"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              <span>View Projects</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {updates.map((update) => (
              <li
                key={update.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-6 hover:bg-surface-muted/60 transition-colors duration-150"
              >
                <div className="flex items-start gap-3 min-w-0 max-w-3xl">
                  <span
                    aria-hidden="true"
                    className="mt-2 w-2 h-2 rounded-full bg-primary-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${update.projectId}`}
                      className="text-sm font-semibold text-foreground hover:text-primary-600 transition-colors"
                    >
                      {update.projectTitle || 'Project Update'}
                    </Link>
                    <p className="mt-1 text-sm leading-relaxed text-body">{update.message || ''}</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-muted whitespace-nowrap num shrink-0 pl-5 sm:pl-0">
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
