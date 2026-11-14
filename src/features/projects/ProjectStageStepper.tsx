import {CheckCircle2, Circle, Clock} from 'lucide-react';
import {PROJECT_STATUSES} from '@/config/constants';
import type {ProjectStatus} from '@/types/portal';

interface ProjectStageStepperProps {
  status: ProjectStatus;
}

export function ProjectStageStepper({status}: ProjectStageStepperProps) {
  const currentIndex = PROJECT_STATUSES.indexOf(status);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {PROJECT_STATUSES.map((stage, idx) => {
        let state: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
        if (status === 'Delivered' || idx < currentIndex) {
          state = 'Completed';
        } else if (idx === currentIndex) {
          state = 'In Progress';
        }

        return (
          <div
            key={stage}
            className={`rounded-xl border p-3 flex flex-col gap-2 ${
              state === 'Completed'
                ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30'
                : state === 'In Progress'
                  ? 'border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/60 dark:bg-indigo-950/40'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60'
            }`}
          >
            <div className="flex items-center justify-between">
              {state === 'Completed' ? (
                <CheckCircle2
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              ) : state === 'In Progress' ? (
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600" aria-hidden="true" />
              )}
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {state}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {stage}
            </span>
          </div>
        );
      })}
    </div>
  );
}
