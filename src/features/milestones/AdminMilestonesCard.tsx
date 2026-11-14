import {CheckCircle2, Plus, Trash2} from 'lucide-react';
import {useState} from 'react';
import {Badge, Button, Card, ConfirmDialog, EmptyState, ErrorAlert, Select} from '@/components/ui';
import {
  MILESTONE_BADGE_CLASSES,
  MILESTONE_DOT_CLASSES,
  MILESTONE_STATUSES,
} from '@/config/constants';
import {getErrorMessage} from '@/services/serviceUtils';
import type {MilestoneRecord, MilestoneStatus} from '@/types/portal';
import {formatDateDisplay, formatDateTime} from '@/utils/format';

interface AdminMilestonesCardProps {
  milestones: MilestoneRecord[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
  updatingMilestoneId: string | null;
  onOpenAddModal: () => void;
  onStatusChange: (milestone: MilestoneRecord, nextStatus: MilestoneStatus) => void;
  onDelete: (milestoneId: string) => Promise<void>;
}

export function AdminMilestonesCard({
  milestones,
  loading,
  error = null,
  onRetry,
  retrying = false,
  updatingMilestoneId,
  onOpenAddModal,
  onStatusChange,
  onDelete,
}: AdminMilestonesCardProps) {
  const [deletingMilestone, setDeletingMilestone] = useState<MilestoneRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingMilestone) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await onDelete(deletingMilestone.id);
      setDeletingMilestone(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Unable to delete milestone.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">Milestones</h3>
          <p className="text-xs text-muted mt-0.5">
            Set a milestone to &ldquo;In Review&rdquo; when it is ready for client approval.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" aria-hidden="true" />}
          onClick={onOpenAddModal}
          className="whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Add Milestone
        </Button>
      </div>

      {error && (
        <div className="p-4 border-b border-border">
          <ErrorAlert message={error} onRetry={onRetry} retrying={retrying} />
        </div>
      )}

      {loading ? (
        <ul className="divide-y divide-border">
          {[1, 2].map((row) => (
            <li key={row} className="p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-44 rounded skeleton-shimmer" />
                  <div className="h-5 w-20 rounded-full skeleton-shimmer" />
                </div>
                <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-28 rounded skeleton-shimmer" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
                <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
              </div>
            </li>
          ))}
        </ul>
      ) : milestones.length === 0 ? (
        <EmptyState
          className="border-0 rounded-none shadow-none py-10"
          icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
          title="No milestones added yet"
          description="Add milestones to break down deliverables and let the client approve or request revisions."
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" aria-hidden="true" />}
              onClick={onOpenAddModal}
            >
              Add Milestone
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {milestones.map((m) => (
            <li key={m.id} className="p-6 space-y-3 hover:bg-surface-muted/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="font-heading text-sm font-semibold text-foreground">
                      {m.title || 'Untitled Milestone'}
                    </h4>
                    <Badge
                      dot
                      dotClassName={MILESTONE_DOT_CLASSES[m.status]}
                      className={MILESTONE_BADGE_CLASSES[m.status]}
                    >
                      {m.status}
                    </Badge>
                  </div>
                  {m.description && (
                    <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">
                      {m.description}
                    </p>
                  )}
                  <p className="text-xs text-muted num">Due {formatDateDisplay(m.dueDate)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    aria-label={`Status for ${m.title || 'milestone'}`}
                    value={m.status}
                    disabled={updatingMilestoneId === m.id}
                    onChange={(e) => onStatusChange(m, e.target.value as MilestoneStatus)}
                    className="min-h-[38px] py-1.5 text-xs font-semibold"
                  >
                    {MILESTONE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    disabled={updatingMilestoneId === m.id}
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingMilestone(m);
                    }}
                    aria-label={`Delete ${m.title || 'milestone'}`}
                    className="inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-xl text-muted hover:text-danger-text hover:bg-danger-soft disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {(m.actionByName || m.reviewComment) && (
                <div className="rounded-xl bg-surface-muted border border-border px-4 py-3 text-xs space-y-1">
                  {m.actionByName && (
                    <p className="text-muted">
                      <span className="font-semibold text-foreground">{m.actionByName}</span>{' '}
                      marked as <span className="font-semibold text-foreground">{m.status}</span>
                      {m.actionAt ? ` on ${formatDateTime(m.actionAt)}` : ''}
                    </p>
                  )}
                  {m.reviewComment && (
                    <p className="text-danger-text font-medium">
                      Requested changes: &ldquo;{m.reviewComment}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deletingMilestone)}
        title="Delete Milestone"
        titleId="delete-milestone-title"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {deletingMilestone?.title || 'this milestone'}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmBusyLabel="Deleting..."
        loading={isDeleting}
        error={deleteError}
        onClose={() => {
          setDeleteError(null);
          setDeletingMilestone(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </Card>
  );
}
