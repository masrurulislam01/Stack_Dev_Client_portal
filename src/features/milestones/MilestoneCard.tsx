import {Check, RotateCcw, Trash2} from 'lucide-react';
import {useState} from 'react';
import {z} from 'zod';
import {Button, Select, Textarea} from '@/components/ui';
import {MILESTONE_BADGE_CLASSES, MILESTONE_STATUSES} from '@/lib/constants';
import type {MilestoneRecord, MilestoneStatus} from '@/types/portal';
import {formatDateDisplay, formatDateTime} from '@/utils/format';

const changeFeedbackSchema = z.object({
  feedback: z
    .string()
    .trim()
    .min(1, 'Please describe the changes you would like before submitting.')
    .max(2000, 'Feedback must be 2000 characters or fewer.'),
});

interface MilestoneCardProps {
  milestone: MilestoneRecord;
  mode: 'admin' | 'client';
  busy?: boolean;
  onStatusChange?: (milestone: MilestoneRecord, nextStatus: MilestoneStatus) => void;
  onDelete?: (milestoneId: string) => void;
  onApprove?: (milestone: MilestoneRecord) => Promise<void>;
  onRequestChanges?: (milestone: MilestoneRecord, comment: string) => Promise<void>;
}

export function MilestoneCard({
  milestone: m,
  mode,
  busy = false,
  onStatusChange,
  onDelete,
  onApprove,
  onRequestChanges,
}: MilestoneCardProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [changeComment, setChangeComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const isInReview = m.status === 'In Review';

  const handleSubmitChanges = async () => {
    if (!onRequestChanges) return;
    const parsed = changeFeedbackSchema.safeParse({feedback: changeComment});
    if (!parsed.success) {
      setCommentError(
        parsed.error.issues[0]?.message ??
          'Please describe the changes you would like before submitting.',
      );
      return;
    }
    setCommentError(null);
    await onRequestChanges(m, parsed.data.feedback);
    setIsRequesting(false);
    setChangeComment('');
  };

  return (
    <li className={mode === 'admin' ? 'p-6 space-y-3' : 'py-4 space-y-3'}>
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
          {m.dueDate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Due {formatDateDisplay(m.dueDate)}
            </p>
          )}
        </div>

        {mode === 'admin' ? (
          <div className="flex items-center gap-2 shrink-0">
            <Select
              aria-label={`Status for ${m.title}`}
              value={m.status}
              disabled={busy}
              onChange={(e) => onStatusChange?.(m, e.target.value as MilestoneStatus)}
              className="min-h-0 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
            >
              {MILESTONE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={() => onDelete?.(m.id)}
              aria-label={`Delete ${m.title}`}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          isInReview && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="success"
                size="sm"
                disabled={busy}
                onClick={() => void onApprove?.(m)}
                leftIcon={<Check className="w-3.5 h-3.5" aria-hidden="true" />}
              >
                {busy && !isRequesting ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                variant="warning"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setIsRequesting((prev) => !prev);
                  setChangeComment('');
                  setCommentError(null);
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />}
              >
                Request Changes
              </Button>
            </div>
          )
        )}
      </div>

      {mode === 'client' && isInReview && isRequesting && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-4 space-y-3">
          <Textarea
            id={`change-comment-${m.id}`}
            label="What changes are needed? (Required)"
            rows={3}
            value={changeComment}
            onChange={(e) => setChangeComment(e.target.value)}
            error={commentError ?? undefined}
            placeholder="Describe the adjustments you would like the team to make..."
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => {
                setIsRequesting(false);
                setChangeComment('');
                setCommentError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void handleSubmitChanges()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {busy ? 'Submitting...' : 'Submit Revision Request'}
            </Button>
          </div>
        </div>
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
              {mode === 'admin' ? 'Requested changes' : 'Comment'}: &ldquo;{m.reviewComment}&rdquo;
            </p>
          )}
        </div>
      )}
    </li>
  );
}
