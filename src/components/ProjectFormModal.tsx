import {zodResolver} from '@hookform/resolvers/zod';
import {X} from 'lucide-react';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {
  PROJECT_PACKAGES,
  PROJECT_STATUSES,
  projectFormSchema,
  type ClientRecord,
  type ProjectFormParsed,
  type ProjectFormValues,
  type ProjectRecord,
} from '../types/portal';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ProjectFormParsed) => Promise<void>;
  clients: ClientRecord[];
  initialProject?: ProjectRecord | null;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSave,
  clients,
  initialProject,
}: ProjectFormModalProps) {
  const isEditing = Boolean(initialProject);

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<ProjectFormValues, unknown, ProjectFormParsed>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: '',
      clientId: clients[0]?.id ?? '',
      package: 'basic',
      status: 'Planning',
      progress: 0,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      revisionsAllowed: 2,
      revisionsUsed: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialProject) {
      reset({
        title: initialProject.title,
        clientId: initialProject.clientId,
        package: initialProject.package,
        status: initialProject.status,
        progress: initialProject.progress,
        startDate: initialProject.startDate,
        dueDate: initialProject.dueDate,
        revisionsAllowed: initialProject.revisionsAllowed,
        revisionsUsed: initialProject.revisionsUsed,
        description: initialProject.description,
      });
    } else {
      reset({
        title: '',
        clientId: clients[0]?.id ?? '',
        package: 'basic',
        status: 'Planning',
        progress: 0,
        startDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        revisionsAllowed: 2,
        revisionsUsed: 0,
        description: '',
      });
    }
  }, [isOpen, initialProject, clients, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (values: ProjectFormParsed) => {
    await onSave(values);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl my-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3
            id="project-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {isEditing ? 'Edit Project' : 'New Project'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="proj-title"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Project Title
              </label>
              <input
                id="proj-title"
                type="text"
                {...register('title')}
                placeholder="e.g. Dhaka Commerce Flutter App"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="proj-client"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Client
              </label>
              <select
                id="proj-client"
                {...register('clientId')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.clientId.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="proj-package"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Package
              </label>
              <select
                id="proj-package"
                {...register('package')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              >
                {PROJECT_PACKAGES.map((pkg) => (
                  <option key={pkg.value} value={pkg.value}>
                    {pkg.label}
                  </option>
                ))}
              </select>
              {errors.package && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.package.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="proj-status"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Status
              </label>
              <select
                id="proj-status"
                {...register('status')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="proj-progress"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Progress (%)
              </label>
              <input
                id="proj-progress"
                type="number"
                min={0}
                max={100}
                {...register('progress')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              {errors.progress && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.progress.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="proj-start"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Start Date
              </label>
              <input
                id="proj-start"
                type="date"
                {...register('startDate')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="proj-due"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Due Date
              </label>
              <input
                id="proj-due"
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
                htmlFor="proj-rev-allowed"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Revisions Allowed
              </label>
              <input
                id="proj-rev-allowed"
                type="number"
                min={0}
                {...register('revisionsAllowed')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              {errors.revisionsAllowed && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.revisionsAllowed.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="proj-rev-used"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Revisions Used
              </label>
              <input
                id="proj-rev-used"
                type="number"
                min={0}
                {...register('revisionsUsed')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              {errors.revisionsUsed && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.revisionsUsed.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="proj-desc"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Description
              </label>
              <textarea
                id="proj-desc"
                rows={3}
                {...register('description')}
                placeholder="Scope, key deliverables, tech stack, and milestone notes..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
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
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
