import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Input, Modal, Select, Textarea} from '@/components/ui';
import {getErrorMessage} from '@/services/serviceUtils';
import {
  MILESTONE_STATUSES,
  milestoneFormSchema,
  type MilestoneFormParsed,
  type MilestoneFormValues,
} from '@/types/portal';

interface MilestoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMilestone: (values: MilestoneFormParsed) => Promise<void>;
}

function getDefaultDueDate(): string {
  return new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
}

export function MilestoneFormModal({
  isOpen,
  onClose,
  onAddMilestone,
}: MilestoneFormModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<MilestoneFormValues, unknown, MilestoneFormParsed>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: getDefaultDueDate(),
      status: 'Pending',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    reset({
      title: '',
      description: '',
      dueDate: getDefaultDueDate(),
      status: 'Pending',
    });
  }, [isOpen, reset]);

  const handleValidSubmit = async (values: MilestoneFormParsed) => {
    setSubmitError(null);
    try {
      await onAddMilestone(values);
      reset({
        title: '',
        description: '',
        dueDate: getDefaultDueDate(),
        status: 'Pending',
      });
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to add milestone.'));
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Add Milestone"
      titleId="milestone-modal-title"
      maxWidthClass="max-w-lg"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit(handleValidSubmit)} className="p-6 space-y-5" noValidate>
        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-75">
          <Input
            id="ms-title"
            type="text"
            label="Milestone Title"
            error={errors.title?.message}
            {...register('title')}
            placeholder="e.g. UI/UX Figma Wireframes"
          />

          <Textarea
            id="ms-desc"
            rows={3}
            label="Description"
            error={errors.description?.message}
            {...register('description')}
            placeholder="Deliverables included in this checkpoint..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="ms-due"
              type="date"
              label="Due Date"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />

            <Select id="ms-status" label="Initial Status" {...register('status')}>
              {MILESTONE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </fieldset>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Milestone'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
