import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Modal} from '@/components/ui';
import {ProjectFormFields} from '@/features/projects/ProjectFormFields';
import {getErrorMessage} from '@/services/serviceUtils';
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
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);
    if (initialProject) {
      reset({
        title: initialProject.title ?? '',
        clientId: initialProject.clientId ?? '',
        package: initialProject.package ?? 'basic',
        status: initialProject.status ?? 'Planning',
        progress: Number(initialProject.progress) || 0,
        startDate: initialProject.startDate ?? new Date().toISOString().slice(0, 10),
        dueDate:
          initialProject.dueDate ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        revisionsAllowed: Number(initialProject.revisionsAllowed) || 0,
        revisionsUsed: Number(initialProject.revisionsUsed) || 0,
        description: initialProject.description ?? '',
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
    setSubmitError(null);
    try {
      await onSave(values);
      onClose();
    } catch (err) {
      setSubmitError(
        getErrorMessage(err, isEditing ? 'Unable to update project.' : 'Unable to create project.'),
      );
    }
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
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <fieldset disabled={isSubmitting} className="disabled:opacity-75">
          <ProjectFormFields register={register} errors={errors} clients={clients} />
        </fieldset>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
