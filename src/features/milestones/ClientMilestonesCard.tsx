import {Check, CheckCircle2, RotateCcw} from 'lucide-react';
import {useState} from 'react';
import {Badge, Button, Card, ErrorAlert} from '@/components/ui';
import {MILESTONE_BADGE_CLASSES, MILESTONE_DOT_CLASSES} from '@/config/constants';
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
  error?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
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
  error = null,
  onRetry,
  retrying = false,
  submittingActionId,
  onApprove,
  onRequestChanges,
}: ClientMilestonesCardProps) {
  const [requestingChangesId, setRequestingChangesId] = useState<string | null>(null);
  const revisionsExceeded = revisionsUsed > revisionsAllowed;
  const revisionRatio =
    revisionsAllowed > 0
      ? Math.min(100, Math.round((revisionsUsed / revisionsAllowed) * 100))
      : revisionsUsed > 0
        ? 100
        : 0;
  const revisionNearLimit = !revisionsExceeded && revisionsAllowed > 0 && revisionRatio >= 75;

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
    <Card className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">Milestones</h3>
          <p className="text-xs text-muted mt-0.5">
            Review deliverable checkpoints and approve or request changes.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs font-semibold num ${
              revisionsExceeded
                ? 'text-danger-text'
                : revisionNearLimit
                  ? 'text-warning-text'
                  : 'text-muted'
            }`}
          >
            Revisions: {revisionsUsed}/{revisionsAllowed} used
          </span>
          <div className="h-1.5 w-28 rounded-full bg-surface-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                revisionsExceeded
                  ? 'bg-danger'
                  : revisionNearLimit
                    ? 'bg-warning'
                    : 'bg-success'
              }`}
              style={{width: `${revisionRatio}%`}}
            />
          </div>
        </div>
      </div>

      <ProjectStageStepper status={projectStatus} />

      {error && <ErrorAlert message={error} onRetry={onRetry} retrying={retrying} />}

      {loading ? (
        <ul className="divide-y divide-border border-t border-border pt-2">
          {[1, 2].map((row) => (
            <li key={row} className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-44 rounded skeleton-shimmer" />
                  <div className="h-5 w-20 rounded-full skeleton-shimmer" />
                </div>
                <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-28 rounded skeleton-shimmer" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 rounded-xl skeleton-shimmer" />
                <div className="h-9 w-32 rounded-xl skeleton-shimmer" />
              </div>
            </li>
          ))}
        </ul>
      ) : milestones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="font-heading text-sm font-semibold text-foreground">
            No milestones scheduled yet
          </p>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            Your Stack Dev project manager will post deliverable review checkpoints here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border-t border-border pt-2">
          {milestones.map((m) => {
            const isInReview = m.status === 'In Review';
            const isRequesting = requestingChangesId === m.id;
            const isBusy = submittingActionId === m.id;

            return (
              <li key={m.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="font-heading text-sm font-semibold text-foreground">
                        {m.title || 'Untitled Milestone'}
                      </p>
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
                    {m.dueDate && (
                      <p className="text-xs text-muted num">Due {formatDateDisplay(m.dueDate)}</p>
                    )}
                  </div>

                  {isInReview && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        loading={isBusy && !isRequesting}
                        disabled={isBusy}
                        icon={<Check className="w-3.5 h-3.5" aria-hidden="true" />}
                        onClick={() => void handleApprove(m)}
                      >
                        {isBusy && !isRequesting ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        icon={<RotateCcw className="w-3.5 h-3.5 text-warning-text" aria-hidden="true" />}
                        onClick={() => setRequestingChangesId(isRequesting ? null : m.id)}
                        className="border-warning/35 bg-warning-soft text-warning-text hover:brightness-95"
                      >
                        Request Changes
                      </Button>
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
    </Card>
  );
}
