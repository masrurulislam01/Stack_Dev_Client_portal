import {FolderKanban} from 'lucide-react';
import {useMemo, useState} from 'react';
import {EmptyState} from '@/components/ui';
import {ProjectCard} from '@/features/projects/ProjectCard';
import {useAuth, useProjects} from '@/hooks';
import {getErrorMessage} from '@/services/serviceUtils';

type ProjectFilter = 'all' | 'active' | 'delivered';

export function ClientProjectsPage() {
  const {user} = useAuth();
  const clientId = user?.clientId ?? '';
  const [filter, setFilter] = useState<ProjectFilter>('all');

  const {data: projects = [], isLoading: loading, error} = useProjects(
    clientId,
    Boolean(clientId),
  );

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
        <EmptyState
          icon={<FolderKanban className="w-5 h-5" aria-hidden="true" />}
          title={filter === 'all' ? 'No projects assigned yet' : `No ${filter} projects`}
          description={
            filter === 'all'
              ? 'Once your Stack Dev project manager sets up your project, you can track progress and milestones here.'
              : 'Switch the filter above to see your other projects.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} mode="client" />
          ))}
        </div>
      )}
    </section>
  );
}
