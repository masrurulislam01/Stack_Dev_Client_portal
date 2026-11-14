import {ArrowRight, Calendar, Pencil, Trash2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_TEXT_CLASSES,
} from '@/lib/constants';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

interface ProjectCardProps {
  project: ProjectRecord;
  mode: 'admin' | 'client';
  onEdit?: (project: ProjectRecord) => void;
  onDelete?: (project: ProjectRecord) => void;
}

export function ProjectCard({project, mode, onEdit, onDelete}: ProjectCardProps) {
  const barColorClass =
    project.status === 'Delivered'
      ? 'bg-emerald-600 dark:bg-emerald-500'
      : 'bg-indigo-600 dark:bg-indigo-500';

  if (mode === 'client') {
    return (
      <Link
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
            <div className={`h-full rounded-full transition-all ${barColorClass}`} style={{width: `${project.progress}%`}} />
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
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
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
              onClick={() => onEdit?.(project)}
              aria-label={`Edit ${project.title}`}
              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(project)}
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
            <div className={`h-full rounded-full transition-all ${barColorClass}`} style={{width: `${project.progress}%`}} />
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
  );
}
