import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Modal} from '@/components/ui';
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
    reset({
      title: '',
      description: '',
      dueDate: getDefaultDueDate(),
      status: 'Pending',
    });
  }, [isOpen, reset]);

  const handleValidSubmit = async (values: MilestoneFormParsed) => {
    await onAddMilestone(values);
    reset({
      title: '',
      description: '',
      dueDate: getDefaultDueDate(),
      status: 'Pending',
    });
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
      <form onSubmit={handleSubmit(handleValidSubmit)} className="p-6 space-y-4" noValidate>
        <div>
          <label
            htmlFor="ms-title"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Milestone Title
          </label>
          <input
            id="ms-title"
            type="text"
            {...register('title')}
            placeholder="e.g. UI/UX Figma Wireframes"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="ms-desc"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Description
          </label>
          <textarea
            id="ms-desc"
            rows={3}
            {...register('description')}
            placeholder="Deliverables included in this checkpoint..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ms-due"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Due Date
            </label>
            <input
              id="ms-due"
              type="date"
              {...register('dueDate')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
            {errors.dueDate && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.dueDate.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="ms-status"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Initial Status
            </label>
            <select
              id="ms-status"
              {...register('status')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            >
              {MILESTONE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            {isSubmitting ? 'Adding...' : 'Add Milestone'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
