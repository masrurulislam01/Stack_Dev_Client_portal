import {useQuery} from '@tanstack/react-query';
import {ArrowRight, Calendar, FolderKanban} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {PROJECT_STATUS_BADGE_CLASSES} from '@/config/constants';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {list as listProjects} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import {formatDateDisplay} from '@/utils/format';

type ProjectFilter = 'all' | 'active' | 'delivered';

export function ClientProjectsPage() {
  const {user} = useAuth();
  const clientId = user?.clientId ?? '';
  const [filter, setFilter] = useState<ProjectFilter>('all');

  const {
    data: projects = [],
    isLoading: loading,
    error,
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
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Projects
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track milestones, sprint progress, and deliverables for your Stack Dev engagements.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl self-start">
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
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {getErrorMessage(error, 'Unable to load projects.')}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <FolderKanban className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {filter === 'all' ? 'No projects assigned yet' : `No ${filter} projects`}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {filter === 'all'
              ? 'Once your Stack Dev project manager sets up your project, you can track progress and milestones here.'
              : 'Switch the filter above to see your other projects.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between gap-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {project.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {project.package} package
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
                >
                  {project.status}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {project.progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      project.status === 'Delivered'
                        ? 'bg-emerald-600 dark:bg-emerald-500'
                        : 'bg-indigo-600 dark:bg-indigo-500'
                    }`}
                    style={{width: `${project.progress}%`}}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Due {formatDateDisplay(project.dueDate)}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                  <span>View Overview</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
