import {CheckCircle2, Plus, Trash2} from 'lucide-react';
import {MILESTONE_BADGE_CLASSES, MILESTONE_STATUSES} from '@/config/constants';
import type {MilestoneRecord, MilestoneStatus} from '@/types/portal';
import {formatDateDisplay, formatDateTime} from '@/utils/format';

interface AdminMilestonesCardProps {
  milestones: MilestoneRecord[];
  loading: boolean;
  updatingMilestoneId: string | null;
  onOpenAddModal: () => void;
  onStatusChange: (milestone: MilestoneRecord, nextStatus: MilestoneStatus) => void;
  onDelete: (milestoneId: string) => void;
}

export function AdminMilestonesCard({
  milestones,
  loading,
  updatingMilestoneId,
  onOpenAddModal,
  onStatusChange,
  onDelete,
}: AdminMilestonesCardProps) {
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
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Milestone</span>
        </button>
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
            Add milestones to break down deliverables and let the client approve or request
            revisions.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {milestones.map((m) => (
            <li key={m.id} className="p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {m.title}
                    </h4>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Due {formatDateDisplay(m.dueDate)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    aria-label={`Status for ${m.title}`}
                    value={m.status}
                    disabled={updatingMilestoneId === m.id}
                    onChange={(e) => onStatusChange(m, e.target.value as MilestoneStatus)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
                  >
                    {MILESTONE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    aria-label={`Delete ${m.title}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

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
                      Requested changes: &ldquo;{m.reviewComment}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
