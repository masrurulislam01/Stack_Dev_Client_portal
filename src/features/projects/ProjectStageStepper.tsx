import {Check} from 'lucide-react';
import {PROJECT_STATUSES} from '@/config/constants';
import type {ProjectStatus} from '@/types/portal';

interface ProjectStageStepperProps {
  status: ProjectStatus;
}

export function ProjectStageStepper({status}: ProjectStageStepperProps) {
  const currentIndex = PROJECT_STATUSES.indexOf(status);

  return (
    <div className="relative pt-1">
      <div
        aria-hidden="true"
        className="hidden sm:block absolute top-5 left-[10%] right-[10%] h-0.5 bg-border"
      />
      <ol className="relative grid grid-cols-2 sm:grid-cols-5 gap-3">
        {PROJECT_STATUSES.map((stage, idx) => {
          let state: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
          if (status === 'Delivered' || idx < currentIndex) {
            state = 'Completed';
          } else if (idx === currentIndex) {
            state = 'In Progress';
          }

          return (
            <li
              key={stage}
              className="flex sm:flex-col items-center sm:text-center gap-2.5 sm:gap-2 p-2.5 sm:p-1 rounded-xl border sm:border-0 border-border bg-surface-muted/40 sm:bg-transparent"
            >
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                  state === 'Completed'
                    ? 'bg-success text-white shadow-xs'
                    : state === 'In Progress'
                      ? 'bg-primary-50 text-primary-600 border-2 border-primary-600 ring-[3px] ring-ring'
                      : 'bg-surface-muted text-subtle border border-border'
                }`}
              >
                {state === 'Completed' ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <span className="num">{idx + 1}</span>
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={`text-xs font-semibold truncate ${
                    state === 'In Progress'
                      ? 'text-primary-600'
                      : state === 'Completed'
                        ? 'text-foreground'
                        : 'text-muted'
                  }`}
                >
                  {stage}
                </p>
                <p
                  className={`text-[11px] font-medium ${
                    state === 'Completed'
                      ? 'text-success-text'
                      : state === 'In Progress'
                        ? 'text-primary-600'
                        : 'text-subtle'
                  }`}
                >
                  {state}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
