import {ArrowLeft, Pencil} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PROJECT_STATUS_TEXT_CLASSES} from '@/config/constants';
import type {ProjectRecord} from '@/types/portal';

interface AdminProjectHeaderProps {
  project: ProjectRecord;
  onEdit: () => void;
}

export function AdminProjectHeader({project, onEdit}: AdminProjectHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Projects</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {project.title}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>{project.clientName}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{project.package} package</span>
          <span aria-hidden="true">·</span>
          <span className={`font-medium ${PROJECT_STATUS_TEXT_CLASSES[project.status]}`}>
            {project.status}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
      >
        <Pencil className="w-4 h-4" aria-hidden="true" />
        <span>Edit Project</span>
      </button>
    </div>
  );
}
