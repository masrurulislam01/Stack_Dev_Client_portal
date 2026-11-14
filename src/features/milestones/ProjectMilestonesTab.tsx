import {CheckCircle2, Circle, Clock, Plus} from 'lucide-react';
import {useMemo} from 'react';
import {Button} from '@/components/ui';
import {MilestoneCard} from '@/features/milestones/MilestoneCard';
import {PROJECT_STATUSES} from '@/lib/constants';
import type {MilestoneRecord, MilestoneStatus, ProjectRecord} from '@/types/portal';

interface ProjectMilestonesTabProps {
  project: ProjectRecord;
  milestones: MilestoneRecord[];
  loading: boolean;
  mode: 'admin' | 'client';
  busyMilestoneId: string | null;
  onOpenAddModal?: () => void;
  onStatusChange?: (milestone: MilestoneRecord, nextStatus: MilestoneStatus) => void;
  onDeleteMilestone?: (milestoneId: string) => void;
  onApproveMilestone?: (milestone: MilestoneRecord) => Promise<void>;
  onRequestChanges?: (milestone: MilestoneRecord, comment: string) => Promise<void>;
}

export function ProjectMilestonesTab({
  project,
  milestones,
  loading,
  mode,
  busyMilestoneId,
  onOpenAddModal,
  onStatusChange,
  onDeleteMilestone,
  onApproveMilestone,
  onRequestChanges,
}: ProjectMilestonesTabProps) {
  const revisionsExceeded = project.revisionsUsed > project.revisionsAllowed;

  const stageMilestones = useMemo(() => {
    const currentIndex = PROJECT_STATUSES.indexOf(project.status);
    return PROJECT_STATUSES.map((stage, idx) => {
      let state: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
      if (project.status === 'Delivered' || idx < currentIndex) {
        state = 'Completed';
      } else if (idx === currentIndex) {
        state = 'In Progress';
      }
      return {stage, state};
    });
  }, [project.status]);

  if (mode === 'admin') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Milestones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set a milestone to &ldquo;In Review&rdquo; when it is ready for client approval.
            </p>
          </div>
          <Button
            size="sm"
            onClick={onOpenAddModal}
            leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
          >
            Add Milestone
          </Button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2].map((row) => (
              <div key={row} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2
              className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2.5"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No milestones added yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add milestones to break down deliverables and let the client approve or request revisions.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {milestones.map((m) => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                mode="admin"
                busy={busyMilestoneId === m.id}
                onStatusChange={onStatusChange}
                onDelete={onDeleteMilestone}
              />
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Milestones</h3>
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
          Revisions: {project.revisionsUsed}/{project.revisionsAllowed} used
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stageMilestones.map(({stage, state}) => (
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
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse pt-2">
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          No specific milestones have been scheduled yet. Your Stack Dev project manager will post review checkpoints here.
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 pt-2">
          {milestones.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              mode="client"
              busy={busyMilestoneId === m.id}
              onApprove={onApproveMilestone}
              onRequestChanges={onRequestChanges}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
