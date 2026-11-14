import {ArrowRight, FolderKanban, Pencil, Trash2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PROJECT_STATUS_TEXT_CLASSES} from '@/config/constants';
import type {ProjectRecord} from '@/types/portal';

interface AdminProjectsGridProps {
  projects: ProjectRecord[];
  loading: boolean;
  hasActiveFilters: boolean;
  onEdit: (project: ProjectRecord) => void;
  onDelete: (project: ProjectRecord) => void;
}

export function AdminProjectsGrid({
  projects,
  loading,
  hasActiveFilters,
  onEdit,
  onDelete,
}: AdminProjectsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <FolderKanban className="w-5 h-5" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          No projects found
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {hasActiveFilters
            ? 'Try clearing your status or client filter.'
            : 'Create your first project to start tracking milestones and deliverables.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/admin/projects/${project.id}`}
                  className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
                >
                  {project.title}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate">{project.clientName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{project.package}</span>
                  <span aria-hidden="true">·</span>
                  <span className={`font-medium ${PROJECT_STATUS_TEXT_CLASSES[project.status]}`}>
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  aria-label={`Edit ${project.title}`}
                  className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(project)}
                  aria-label={`Delete ${project.title}`}
                  className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Progress</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
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
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="tabular-nums">
              <span>Due {project.dueDate}</span>
              <span aria-hidden="true"> · </span>
              <span
                className={
                  project.revisionsUsed > project.revisionsAllowed
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : ''
                }
              >
                Revisions {project.revisionsUsed}/{project.revisionsAllowed}
              </span>
            </div>
            <Link
              to={`/admin/projects/${project.id}`}
              className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <span>Open</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
