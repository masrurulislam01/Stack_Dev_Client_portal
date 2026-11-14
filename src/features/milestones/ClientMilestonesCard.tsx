import {Check, RotateCcw} from 'lucide-react';
import {useState} from 'react';
import {MILESTONE_BADGE_CLASSES} from '@/config/constants';
import {ClientMilestoneReviewBox} from '@/features/milestones/ClientMilestoneReviewBox';
import {ProjectStageStepper} from '@/features/projects/ProjectStageStepper';
import type {MilestoneRecord, ProjectStatus} from '@/types/portal';
import {formatDateDisplay, formatDateTime} from '@/utils/format';

interface ClientMilestonesCardProps {
  projectStatus: ProjectStatus;
  revisionsUsed: number;
  revisionsAllowed: number;
  milestones: MilestoneRecord[];
  loading: boolean;
  submittingActionId: string | null;
  onApprove: (milestone: MilestoneRecord) => Promise<void>;
  onRequestChanges: (milestone: MilestoneRecord, comment: string) => Promise<void>;
}

export function ClientMilestonesCard({
  projectStatus,
  revisionsUsed,
  revisionsAllowed,
  milestones,
  loading,
  submittingActionId,
  onApprove,
  onRequestChanges,
}: ClientMilestonesCardProps) {
  const [requestingChangesId, setRequestingChangesId] = useState<string | null>(null);
  const revisionsExceeded = revisionsUsed > revisionsAllowed;

  const handleApprove = async (milestone: MilestoneRecord) => {
    await onApprove(milestone);
    if (requestingChangesId === milestone.id) {
      setRequestingChangesId(null);
    }
  };

  const handleSubmitChanges = async (milestone: MilestoneRecord, comment: string) => {
    await onRequestChanges(milestone, comment);
    setRequestingChangesId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Milestones
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review deliverable checkpoints and approve or request changes.
          </p>
        </div>
        <span
          className={`text-xs font-medium tabular-nums ${
            revisionsExceeded
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Revisions: {revisionsUsed}/{revisionsAllowed} used
        </span>
      </div>

      <ProjectStageStepper status={projectStatus} />

      {loading ? (
        <div className="space-y-3 animate-pulse pt-2">
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          No specific milestones have been scheduled yet. Your Stack Dev project manager will post
          review checkpoints here.
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 pt-2">
          {milestones.map((m) => {
            const isInReview = m.status === 'In Review';
            const isRequesting = requestingChangesId === m.id;
            const isBusy = submittingActionId === m.id;

            return (
              <li key={m.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {m.title}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${MILESTONE_BADGE_CLASSES[m.status]}`}
                      >
                        {m.status}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {m.description}
                      </p>
                    )}
                    {m.dueDate && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Due {formatDateDisplay(m.dueDate)}
                      </p>
                    )}
                  </div>

                  {isInReview && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleApprove(m)}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isBusy && !isRequesting ? 'Approving...' : 'Approve'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setRequestingChangesId(isRequesting ? null : m.id)}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Request Changes</span>
                      </button>
                    </div>
                  )}
                </div>

                {isInReview && isRequesting && (
                  <ClientMilestoneReviewBox
                    milestoneId={m.id}
                    isBusy={isBusy}
                    onCancel={() => setRequestingChangesId(null)}
                    onSubmitComment={(comment) => handleSubmitChanges(m, comment)}
                  />
                )}

                {(m.actionByName || m.reviewComment) && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs space-y-1">
                    {m.actionByName && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-900 dark:text-slate-200">
                          {m.actionByName}
                        </span>{' '}
                        marked as <span className="font-medium">{m.status}</span>
                        {m.actionAt ? ` on ${formatDateTime(m.actionAt)}` : ''}
                      </p>
                    )}
                    {m.reviewComment && (
                      <p className="text-red-700 dark:text-red-300">
                        Comment: &ldquo;{m.reviewComment}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
