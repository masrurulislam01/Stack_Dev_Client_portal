import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Input, Modal, Select, Textarea} from '@/components/ui';
import {MILESTONE_STATUSES} from '@/lib/constants';
import {
  milestoneFormSchema,
  type MilestoneFormParsed,
  type MilestoneFormValues,
} from '@/types/portal';

interface MilestoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitMilestone: (values: MilestoneFormParsed) => Promise<void>;
}

const getDefaultDue = () =>
  new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

export function MilestoneFormModal({
  isOpen,
  onClose,
  onSubmitMilestone,
}: MilestoneFormModalProps) {
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
      dueDate: getDefaultDue(),
      status: 'Pending',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      title: '',
      description: '',
      dueDate: getDefaultDue(),
      status: 'Pending',
    });
  }, [isOpen, reset]);

  const handleSave = async (values: MilestoneFormParsed) => {
    await onSubmitMilestone(values);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Milestone"
      size="md"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit(handleSave)} className="p-6 space-y-4" noValidate>
        <Input
          id="ms-title"
          label="Milestone Title"
          placeholder="e.g. UI/UX Figma Wireframes"
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          id="ms-desc"
          label="Description"
          rows={3}
          placeholder="Deliverables included in this checkpoint..."
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="ms-due"
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <Select
            id="ms-status"
            label="Initial Status"
            error={errors.status?.message}
            {...register('status')}
          >
            {MILESTONE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Milestone'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
