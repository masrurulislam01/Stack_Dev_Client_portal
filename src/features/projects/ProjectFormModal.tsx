import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Input, Modal, Select, Textarea} from '@/components/ui';
import {PROJECT_PACKAGES, PROJECT_STATUSES} from '@/lib/constants';
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

const getDefaultDates = () => ({
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
});

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
      ...getDefaultDates(),
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
        ...getDefaultDates(),
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
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'New Project'}
      size="lg"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="proj-title"
            label="Project Title"
            placeholder="e.g. Dhaka Commerce Flutter App"
            wrapperClassName="sm:col-span-2"
            error={errors.title?.message}
            {...register('title')}
          />

          <Select
            id="proj-client"
            label="Client"
            error={errors.clientId?.message}
            {...register('clientId')}
          >
            <option value="">Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </Select>

          <Select
            id="proj-package"
            label="Package"
            error={errors.package?.message}
            {...register('package')}
          >
            {PROJECT_PACKAGES.map((pkg) => (
              <option key={pkg.value} value={pkg.value}>
                {pkg.label}
              </option>
            ))}
          </Select>

          <Select
            id="proj-status"
            label="Status"
            error={errors.status?.message}
            {...register('status')}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <Input
            id="proj-progress"
            label="Progress (%)"
            type="number"
            min={0}
            max={100}
            className="tabular-nums"
            error={errors.progress?.message}
            {...register('progress')}
          />

          <Input
            id="proj-start"
            label="Start Date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />

          <Input
            id="proj-due"
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <Input
            id="proj-rev-allowed"
            label="Revisions Allowed"
            type="number"
            min={0}
            className="tabular-nums"
            error={errors.revisionsAllowed?.message}
            {...register('revisionsAllowed')}
          />

          <Input
            id="proj-rev-used"
            label="Revisions Used"
            type="number"
            min={0}
            className="tabular-nums"
            error={errors.revisionsUsed?.message}
            {...register('revisionsUsed')}
          />

          <Textarea
            id="proj-desc"
            label="Description"
            rows={3}
            placeholder="Scope, key deliverables, tech stack, and milestone notes..."
            wrapperClassName="sm:col-span-2"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
