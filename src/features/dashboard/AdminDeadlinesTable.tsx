import {ArrowRight, CalendarClock, CheckCircle2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PROJECT_STATUS_DOT_CLASSES, PROJECT_STATUS_TEXT_CLASSES} from '@/config/constants';
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t.dashboard.dueNext7Days}
          </h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            {t.dashboard.dueNext7DaysHint}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
          <CalendarClock
            className="w-4 h-4 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {projects.length}
          </span>
          <span>due within 7 days</span>
        </div>
      </div>

      {loading ? (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 animate-pulse">
          {[1, 2, 3].map((row) => (
            <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200/70 dark:border-emerald-900/60">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t.dashboard.noUpcomingDeadlines}
          </p>
          <Link
            to="/admin/projects"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>{t.dashboard.viewAllProjects}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-3 pl-6 pr-4 font-medium">
                  Project &amp; Client
                </th>
                <th scope="col" className="py-3 px-4 font-medium whitespace-nowrap">
                  Stage
                </th>
                <th scope="col" className="py-3 px-4 font-medium whitespace-nowrap">
                  Progress
                </th>
                <th scope="col" className="py-3 px-4 font-medium text-right whitespace-nowrap">
                  Due Date
                </th>
                <th scope="col" className="py-3 pl-4 pr-6 font-medium text-right whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/35 transition-colors duration-150"
                >
                  <td className="py-3.5 pl-6 pr-4 min-w-[220px]">
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className="block focus-visible:outline-none focus-visible:underline"
                    >
                      <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-md">
                        {project.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="truncate max-w-[200px]">{project.clientName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{project.package}</span>
                      </div>
                    </Link>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-2 text-xs font-semibold ${PROJECT_STATUS_TEXT_CLASSES[project.status]}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-1.5 h-1.5 rounded-xs shrink-0 ${PROJECT_STATUS_DOT_CLASSES[project.status]}`}
                      />
                      <span>{project.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 min-w-[150px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden min-w-[72px]">
                        <div
                          className="h-full rounded-sm bg-indigo-600 dark:bg-indigo-500"
                          style={{width: `${project.progress}%`}}
                        />
                      </div>
                      <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums w-9 text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                      {formatDateDisplay(project.dueDate)}
                    </span>
                  </td>

                  <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className="inline-flex items-center justify-end gap-1 min-h-[36px] px-2.5 py-1.5 rounded-md text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    >
                      <span>{t.actions.open}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
