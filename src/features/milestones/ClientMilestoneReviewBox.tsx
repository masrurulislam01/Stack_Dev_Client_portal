import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {
  milestoneReviewCommentSchema,
  type MilestoneReviewCommentParsed,
  type MilestoneReviewCommentValues,
} from '@/types/portal';

interface ClientMilestoneReviewBoxProps {
  milestoneId: string;
  isBusy: boolean;
  onCancel: () => void;
  onSubmitComment: (comment: string) => Promise<void>;
}

export function ClientMilestoneReviewBox({
  milestoneId,
  isBusy,
  onCancel,
  onSubmitComment,
}: ClientMilestoneReviewBoxProps) {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<MilestoneReviewCommentValues, unknown, MilestoneReviewCommentParsed>({
    resolver: zodResolver(milestoneReviewCommentSchema),
    defaultValues: {feedback: ''},
  });

  const handleValidSubmit = async (values: MilestoneReviewCommentParsed) => {
    await onSubmitComment(values.feedback);
  };

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-4 space-y-3"
      noValidate
    >
      <label
        htmlFor={`change-comment-${milestoneId}`}
        className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
      >
        What changes are needed? (Required)
      </label>
      <textarea
        id={`change-comment-${milestoneId}`}
        rows={3}
        {...register('feedback')}
        placeholder="Describe the adjustments you would like the team to make..."
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
      />
      {errors.feedback && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {errors.feedback.message}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={onCancel}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isBusy}
          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
        >
          {isBusy ? 'Submitting...' : 'Submit Revision Request'}
        </button>
      </div>
    </form>
  );
}
