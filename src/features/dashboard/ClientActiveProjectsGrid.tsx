import {ArrowRight, Calendar, FolderKanban} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge} from '@/components/ui';
import {PROJECT_STATUS_BADGE_CLASSES, PROJECT_STATUS_DOT_CLASSES} from '@/config/constants';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

interface ClientActiveProjectsGridProps {
  loading: boolean;
  activeProjects: ProjectRecord[];
  totalProjectsCount: number;
}

export function ClientActiveProjectsGrid({
  loading,
  activeProjects,
  totalProjectsCount,
}: ClientActiveProjectsGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Active Projects
        </h3>
        {!loading && (
          <span className="font-mono text-xs text-muted num">
            {activeProjects.length} active
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="bg-surface rounded-2xl border border-border card-inset p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-6 w-24 rounded-full skeleton-shimmer" />
                <div className="h-4 w-28 rounded-lg skeleton-shimmer" />
              </div>
              <div className="h-5 w-52 rounded-lg skeleton-shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded-lg skeleton-shimmer" />
                <div className="h-2 w-full rounded-full skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border card-inset px-6 py-12 text-center">
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <FolderKanban className="w-5 h-5" aria-hidden="true" />
          </div>
          <h4 className="font-heading text-base font-semibold text-foreground">
            No active projects right now
          </h4>
          <p className="mt-1 text-sm text-muted max-w-md mx-auto leading-relaxed">
            {totalProjectsCount > 0
              ? 'All of your projects have been delivered! You can review completed engagements on the Projects page.'
              : 'When your Stack Dev team kicks off a website or Flutter project, it will appear here with live progress.'}
          </p>
          <Link
            to={totalProjectsCount > 0 ? '/projects' : '/messages'}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
          >
            <span>
              {totalProjectsCount > 0 ? 'View delivered projects' : 'Message Stack Dev team'}
            </span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeProjects.map((project) => {
            const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group relative overflow-hidden bg-surface rounded-2xl border border-border card-inset p-6 flex flex-col justify-between gap-5 hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-35"
                />

                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        dot
                        dotClassName={PROJECT_STATUS_DOT_CLASSES[project.status] ?? 'bg-subtle'}
                        className={
                          PROJECT_STATUS_BADGE_CLASSES[project.status] ??
                          'bg-surface-muted text-muted border border-border'
                        }
                      >
                        {project.status}
                      </Badge>
                      <span className="text-muted capitalize truncate">
                        {project.package || 'custom'}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 font-mono text-muted num whitespace-nowrap shrink-0">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Due {formatDateDisplay(project.dueDate)}</span>
                    </span>
                  </div>

                  <h4 className="font-heading text-lg font-semibold tracking-tight text-foreground group-hover:text-primary-600 transition-colors truncate">
                    {project.title || 'Untitled Project'}
                  </h4>
                </div>

                <div className="relative space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Progress</span>
                    <span className="font-mono font-semibold text-foreground num">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-brand transition-all duration-200"
                      style={{width: `${progress}%`}}
                    />
                  </div>
                </div>

                <div className="relative pt-3.5 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted">Open workspace</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary-600">
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
