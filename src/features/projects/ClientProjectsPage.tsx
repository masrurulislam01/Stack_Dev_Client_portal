import {useQuery} from '@tanstack/react-query';
import {ArrowRight, Calendar, FolderKanban} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {Badge, Button, Card, EmptyState, ErrorAlert} from '@/components/ui';
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_DOT_CLASSES,
} from '@/config/constants';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {list as listProjects} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

type ProjectFilter = 'all' | 'active' | 'delivered';

function isProjectOverdue(project: ProjectRecord): boolean {
  if (!project.dueDate || project.status === 'Delivered') return false;
  const due = new Date(project.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function ClientProjectsPage() {
  const {user} = useAuth();
  const clientId = user?.clientId ?? '';
  const [filter, setFilter] = useState<ProjectFilter>('all');

  const {
    data: projects = [],
    isLoading: loading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.projects.list(clientId),
    queryFn: () => listProjects({clientId}),
    enabled: Boolean(clientId),
  });

  const filteredProjects = useMemo(() => {
    if (filter === 'active') return projects.filter((p) => p.status !== 'Delivered');
    if (filter === 'delivered') return projects.filter((p) => p.status === 'Delivered');
    return projects;
  }, [projects, filter]);

  return (
    <section className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted">
            Track milestones, sprint progress, and deliverables for your Stack Dev engagements.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-surface-muted border border-border rounded-xl self-start">
          {(
            [
              {id: 'all', label: 'All'},
              {id: 'active', label: 'Active'},
              {id: 'delivered', label: 'Delivered'},
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                filter === tab.id
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <ErrorAlert
          message={getErrorMessage(error, 'Unable to load projects.')}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-5 w-48 rounded-lg skeleton-shimmer" />
                  <div className="h-3.5 w-28 rounded-lg skeleton-shimmer" />
                </div>
                <div className="h-6 w-24 rounded-full skeleton-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-16 rounded skeleton-shimmer" />
                  <div className="h-3 w-8 rounded skeleton-shimmer" />
                </div>
                <div className="h-2 w-full rounded-full skeleton-shimmer" />
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="h-3.5 w-28 rounded skeleton-shimmer" />
                <div className="h-3.5 w-24 rounded skeleton-shimmer" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-5 h-5" aria-hidden="true" />}
          title={filter === 'all' ? 'No projects assigned yet' : `No ${filter} projects`}
          description={
            filter === 'all'
              ? 'Once your Stack Dev project manager sets up your project, you can track progress and milestones here.'
              : 'Switch the filter above to see your other projects.'
          }
          action={
            filter !== 'all' ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setFilter('all')}>
                Show all projects
              </Button>
            ) : (
              <Link
                to="/messages"
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-semibold hover:brightness-110 transition-all"
              >
                <span>Message Stack Dev team</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((project) => {
            const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
            const overdue = isProjectOverdue(project);

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group relative overflow-hidden bg-surface rounded-2xl border border-border card-inset p-6 flex flex-col justify-between gap-5 transition-all duration-150 hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-hero opacity-60"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-base font-semibold text-foreground group-hover:text-primary-600 transition-colors truncate">
                      {project.title || 'Untitled Project'}
                    </h2>
                    <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-surface-muted border border-border text-[11px] font-medium text-muted capitalize">
                      {project.package || 'custom'} package
                    </span>
                  </div>
                  <Badge
                    dot
                    dotClassName={PROJECT_STATUS_DOT_CLASSES[project.status]}
                    className={PROJECT_STATUS_BADGE_CLASSES[project.status]}
                  >
                    {project.status}
                  </Badge>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted font-medium">Progress</span>
                    <span className="font-semibold text-foreground num">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        project.status === 'Delivered' ? 'bg-success' : 'bg-gradient-brand'
                      }`}
                      style={{width: `${progress}%`}}
                    />
                  </div>
                </div>

                <div className="relative pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 num ${
                      overdue ? 'text-danger-text font-semibold' : 'text-muted'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Due {formatDateDisplay(project.dueDate)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary-600 group-hover:text-primary-700 transition-colors">
                    <span>View Overview</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
