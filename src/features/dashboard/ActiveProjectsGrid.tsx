import {ArrowRight, Calendar, FolderKanban} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PROJECT_STATUS_DOT_CLASSES, PROJECT_STATUS_TEXT_CLASSES} from '@/lib/constants';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

export interface ActiveProjectsGridProps {
  activeProjects: ProjectRecord[];
  totalProjectsCount: number;
  loading: boolean;
}

export function ActiveProjectsGrid({
  activeProjects,
  totalProjectsCount,
  loading,
}: ActiveProjectsGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Active Projects
        </h3>
        {!loading && (
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {activeProjects.length} active
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-pulse"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-5 w-52 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-1.5 w-full rounded-sm bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6 py-12 text-center">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-200/70 dark:border-indigo-900/60">
            <FolderKanban className="w-5 h-5" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No active projects right now
          </h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {totalProjectsCount > 0
              ? 'All of your projects have been delivered! You can review completed engagements on the Projects page.'
              : 'When your Stack Dev team kicks off a website or Flutter project, it will appear here with live progress.'}
          </p>
          {totalProjectsCount > 0 && (
            <Link
              to="/projects"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>View delivered projects</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap ${PROJECT_STATUS_TEXT_CLASSES[project.status]}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-1.5 h-1.5 rounded-xs shrink-0 ${PROJECT_STATUS_DOT_CLASSES[project.status]}`}
                      />
                      <span>{project.status}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 capitalize truncate">
                      {project.package} package
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Due {formatDateDisplay(project.dueDate)}</span>
                  </span>
                </div>

                <h4 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {project.title}
                </h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {project.progress}%
                  </span>
                </div>
                <div className="h-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-indigo-600 dark:bg-indigo-500 transition-all duration-200"
                    style={{width: `${project.progress}%`}}
                  />
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Open workspace</span>
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
