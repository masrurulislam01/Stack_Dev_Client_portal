import {AlertTriangle, ArrowLeft, Pencil} from 'lucide-react';
import {Link} from 'react-router-dom';
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_TEXT_CLASSES,
} from '@/lib/constants';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

interface ProjectHeaderCardProps {
  project: ProjectRecord;
  mode: 'admin' | 'client';
  backTo: string;
  actionError: string | null;
  onDismissError: () => void;
  onEditProject?: () => void;
}

export function ProjectHeaderCard({
  project,
  mode,
  backTo,
  actionError,
  onDismissError,
  onEditProject,
}: ProjectHeaderCardProps) {
  const revisionsExceeded = project.revisionsUsed > project.revisionsAllowed;

  return (
    <div className="space-y-6">
      {mode === 'admin' ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to={backTo}
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
            onClick={onEditProject}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            <span>Edit Project</span>
          </button>
        </div>
      ) : (
        <div>
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Projects</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {project.title}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
            >
              {project.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 capitalize">
            {project.package} package · Due {formatDateDisplay(project.dueDate)}
          </p>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={onDismissError}
            className="text-xs font-medium underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {revisionsExceeded && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-5 py-4 flex items-start gap-3 text-sm text-red-800 dark:text-red-300"
        >
          <AlertTriangle
            className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">
              {mode === 'admin' ? 'Revision limit exceeded' : 'Included revisions exceeded'}
            </p>
            <p className="mt-0.5 text-xs sm:text-sm text-red-700 dark:text-red-300/90 tabular-nums">
              {mode === 'admin'
                ? `${project.revisionsUsed} revisions have been used out of ${project.revisionsAllowed} allowed for this package.`
                : `${project.revisionsUsed} of ${project.revisionsAllowed} included revisions have been used. Additional revision rounds may incur extra charges.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
