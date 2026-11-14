import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Modal} from '@/components/ui';
import {ProjectFormFields} from '@/features/projects/ProjectFormFields';
import {
  projectFormSchema,
  type ClientRecord,
  type ProjectFormParsed,
  type ProjectFormValues,
  type ProjectRecord,
} from '@/types/portal';

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

  const onSubmit = async (values: ProjectFormParsed) => {
    await onSave(values);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'New Project'}
      titleId="project-modal-title"
      maxWidthClass="max-w-2xl"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
        <ProjectFormFields register={register} errors={errors} clients={clients} />

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
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
