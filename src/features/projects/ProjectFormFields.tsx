import type {FieldErrors, UseFormRegister} from 'react-hook-form';
import {Input, Select, Textarea} from '@/components/ui';
import {PROJECT_PACKAGES, PROJECT_STATUSES} from '@/config/constants';
import type {ClientRecord, ProjectFormValues} from '@/types/portal';

interface ProjectFormFieldsProps {
  register: UseFormRegister<ProjectFormValues>;
  errors: FieldErrors<ProjectFormValues>;
  clients: ClientRecord[];
}

export function ProjectFormFields({register, errors, clients}: ProjectFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <Input
          id="proj-title"
          type="text"
          label="Project Title"
          error={errors.title?.message}
          {...register('title')}
          placeholder="e.g. Dhaka Commerce Flutter App"
        />
      </div>

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
        type="number"
        min={0}
        max={100}
        label="Progress (%)"
        error={errors.progress?.message}
        {...register('progress')}
        className="num"
      />

      <Input
        id="proj-start"
        type="date"
        label="Start Date"
        error={errors.startDate?.message}
        {...register('startDate')}
      />

      <Input
        id="proj-due"
        type="date"
        label="Due Date"
        error={errors.dueDate?.message}
        {...register('dueDate')}
      />

      <Input
        id="proj-rev-allowed"
        type="number"
        min={0}
        label="Revisions Allowed"
        error={errors.revisionsAllowed?.message}
        {...register('revisionsAllowed')}
        className="num"
      />

      <Input
        id="proj-rev-used"
        type="number"
        min={0}
        label="Revisions Used"
        error={errors.revisionsUsed?.message}
        {...register('revisionsUsed')}
        className="num"
      />

      <div className="sm:col-span-2">
        <Textarea
          id="proj-desc"
          rows={3}
          label="Description"
          error={errors.description?.message}
          {...register('description')}
          placeholder="Scope, key deliverables, tech stack, and milestone notes..."
        />
      </div>
    </div>
  );
}
