import {ArrowRight, CalendarClock, CheckCircle2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge} from '@/components/ui';
import {PROJECT_STATUS_BADGE_CLASSES, PROJECT_STATUS_DOT_CLASSES} from '@/config/constants';
import {useLanguage} from '@/hooks/useLanguage';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

interface AdminDeadlinesTableProps {
  loading: boolean;
  projects: ProjectRecord[];
}

export function AdminDeadlinesTable({loading, projects}: AdminDeadlinesTableProps) {
  const {t} = useLanguage();

  return (
    <div className="bg-surface rounded-2xl border border-border card-inset overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {t.dashboard.dueNext7Days}
          </h3>
          <p className="mt-0.5 text-xs text-muted">{t.dashboard.dueNext7DaysHint}</p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-muted border border-border text-xs font-medium text-body num shrink-0">
          <CalendarClock className="w-3.5 h-3.5 text-warning-text" aria-hidden="true" />
          <span className="font-mono font-semibold text-foreground">{projects.length}</span>
          <span>due within 7 days</span>
        </div>
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-muted">
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="py-3.5 pl-6 pr-4">
                  Project &amp; Client
                </th>
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  Stage
                </th>
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  Progress
                </th>
                <th scope="col" className="py-3.5 px-4 text-right whitespace-nowrap">
                  Due Date
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3].map((row) => (
                <tr key={row} className="h-14">
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="space-y-1.5">
                      <div className="h-4 w-48 rounded-lg skeleton-shimmer" />
                      <div className="h-3 w-32 rounded-lg skeleton-shimmer" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-6 w-24 rounded-full skeleton-shimmer" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 min-w-[72px] rounded-full skeleton-shimmer" />
                      <div className="h-3 w-8 rounded-lg skeleton-shimmer" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-3.5 w-20 rounded-lg skeleton-shimmer ml-auto" />
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right">
                    <div className="h-8 w-16 rounded-xl skeleton-shimmer ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : projects.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-11 h-11 rounded-xl bg-success-soft text-success-text flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="font-heading text-base font-semibold text-foreground">
            {t.dashboard.noUpcomingDeadlines}
          </p>
          <Link
            to="/admin/projects"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
          >
            <span>{t.dashboard.viewAllProjects}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-muted">
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <th scope="col" className="py-3.5 pl-6 pr-4">
                  Project &amp; Client
                </th>
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  Stage
                </th>
                <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                  Progress
                </th>
                <th scope="col" className="py-3.5 px-4 text-right whitespace-nowrap">
                  Due Date
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {projects.map((project) => {
                const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));

                return (
                  <tr
                    key={project.id}
                    className="group h-14 hover:bg-surface-muted/60 transition-colors duration-150"
                  >
                    <td className="py-3.5 pl-6 pr-4 min-w-[220px]">
                      <Link
                        to={`/admin/projects/${project.id}`}
                        className="block focus-visible:outline-none focus-visible:underline"
                      >
                        <div className="font-semibold text-foreground group-hover:text-primary-600 transition-colors truncate max-w-md">
                          {project.title || 'Untitled Project'}
                        </div>
                        <div className="mt-0.5 text-xs text-muted flex items-center gap-1.5">
                          <span className="truncate max-w-[200px]">
                            {project.clientName || 'Client'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{project.package || 'custom'}</span>
                        </div>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
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
                    </td>

                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden min-w-[72px]">
                          <div
                            className="h-full rounded-full bg-gradient-brand"
                            style={{width: `${progress}%`}}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold text-body num w-9 text-right">
                          {progress}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-warning-text num">
                        {formatDateDisplay(project.dueDate)}
                      </span>
                    </td>

                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/projects/${project.id}`}
                        className="inline-flex items-center justify-end gap-1 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                      >
                        <span>{t.actions.open}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
