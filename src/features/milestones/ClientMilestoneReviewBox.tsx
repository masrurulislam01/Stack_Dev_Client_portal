import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle} from 'lucide-react';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Textarea} from '@/components/ui';
import {getErrorMessage} from '@/services/serviceUtils';
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<MilestoneReviewCommentValues, unknown, MilestoneReviewCommentParsed>({
    resolver: zodResolver(milestoneReviewCommentSchema),
    defaultValues: {feedback: ''},
  });

  const handleValidSubmit = async (values: MilestoneReviewCommentParsed) => {
    setSubmitError(null);
    try {
      await onSubmitComment(values.feedback);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to submit revision request.'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="rounded-xl border border-warning/30 bg-warning-soft/50 p-4 space-y-3"
      noValidate
    >
      <label
        htmlFor={`change-comment-${milestoneId}`}
        className="block text-xs font-semibold text-foreground"
      >
        What changes are needed? (Required)
      </label>
      <Textarea
        id={`change-comment-${milestoneId}`}
        rows={3}
        disabled={isBusy}
        {...register('feedback')}
        placeholder="Describe the adjustments you would like the team to make..."
      />
      {(errors.feedback || submitError) && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-danger-text">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{errors.feedback?.message || submitError}</span>
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={isBusy} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          loading={isBusy}
          className="bg-warning text-white hover:brightness-105 border-transparent"
        >
          {isBusy ? 'Submitting...' : 'Submit Revision Request'}
        </Button>
      </div>
    </form>
  );
}
