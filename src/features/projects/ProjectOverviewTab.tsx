import type {ReactNode} from 'react';
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_TEXT_CLASSES,
} from '@/lib/constants';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

interface ProjectOverviewTabProps {
  project: ProjectRecord;
  mode: 'admin' | 'client';
  milestonesSection: ReactNode;
}

export function ProjectOverviewTab({
  project,
  mode,
  milestonesSection,
}: ProjectOverviewTabProps) {
  const revisionsExceeded = project.revisionsUsed > project.revisionsAllowed;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Overall Progress
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {project.progress}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

        {mode === 'admin' ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Client</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {project.clientName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Package</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                {project.package}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</dt>
              <dd className={`mt-1 text-sm font-semibold ${PROJECT_STATUS_TEXT_CLASSES[project.status]}`}>
                {project.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Start Date</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {formatDateDisplay(project.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Due Date</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {formatDateDisplay(project.dueDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Revisions</dt>
              <dd
                className={`mt-1 text-sm font-semibold tabular-nums ${
                  revisionsExceeded
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {project.revisionsUsed} used of {project.revisionsAllowed} allowed
              </dd>
            </div>
          </dl>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</dt>
              <dd className="mt-1.5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
                >
                  {project.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Package</dt>
              <dd className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                {project.package}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Start Date</dt>
              <dd className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {formatDateDisplay(project.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Due Date</dt>
              <dd className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {formatDateDisplay(project.dueDate)}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {milestonesSection}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {mode === 'admin' ? 'Project Description' : 'Scope & Description'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
          {project.description ||
            (mode === 'admin'
              ? 'No description provided for this project yet.'
              : 'No additional project description has been added yet.')}
        </p>
      </div>
    </div>
  );
}
