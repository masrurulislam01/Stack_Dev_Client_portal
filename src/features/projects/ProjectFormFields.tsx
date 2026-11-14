import type {ReactNode} from 'react';
import type {FieldErrors, UseFormRegister} from 'react-hook-form';
import {PROJECT_PACKAGES, PROJECT_STATUSES} from '@/config/constants';
import type {ClientRecord, ProjectFormValues} from '@/types/portal';

interface ProjectFormFieldsProps {
  register: UseFormRegister<ProjectFormValues>;
  errors: FieldErrors<ProjectFormValues>;
  clients: ClientRecord[];
}

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20';

function FormField({
  id,
  label,
  error,
  fullWidth = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function ProjectFormFields({register, errors, clients}: ProjectFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField id="proj-title" label="Project Title" error={errors.title?.message} fullWidth>
        <input
          id="proj-title"
          type="text"
          {...register('title')}
          placeholder="e.g. Dhaka Commerce Flutter App"
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField id="proj-client" label="Client" error={errors.clientId?.message}>
        <select id="proj-client" {...register('clientId')} className={INPUT_CLASS}>
          <option value="">Select a client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="proj-package" label="Package" error={errors.package?.message}>
        <select id="proj-package" {...register('package')} className={INPUT_CLASS}>
          {PROJECT_PACKAGES.map((pkg) => (
            <option key={pkg.value} value={pkg.value}>
              {pkg.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="proj-status" label="Status" error={errors.status?.message}>
        <select id="proj-status" {...register('status')} className={INPUT_CLASS}>
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="proj-progress" label="Progress (%)" error={errors.progress?.message}>
        <input
          id="proj-progress"
          type="number"
          min={0}
          max={100}
          {...register('progress')}
          className={`${INPUT_CLASS} tabular-nums`}
        />
      </FormField>

      <FormField id="proj-start" label="Start Date" error={errors.startDate?.message}>
        <input id="proj-start" type="date" {...register('startDate')} className={INPUT_CLASS} />
      </FormField>

      <FormField id="proj-due" label="Due Date" error={errors.dueDate?.message}>
        <input id="proj-due" type="date" {...register('dueDate')} className={INPUT_CLASS} />
      </FormField>

      <FormField
        id="proj-rev-allowed"
        label="Revisions Allowed"
        error={errors.revisionsAllowed?.message}
      >
        <input
          id="proj-rev-allowed"
          type="number"
          min={0}
          {...register('revisionsAllowed')}
          className={`${INPUT_CLASS} tabular-nums`}
        />
      </FormField>

      <FormField
        id="proj-rev-used"
        label="Revisions Used"
        error={errors.revisionsUsed?.message}
      >
        <input
          id="proj-rev-used"
          type="number"
          min={0}
          {...register('revisionsUsed')}
          className={`${INPUT_CLASS} tabular-nums`}
        />
      </FormField>

      <FormField id="proj-desc" label="Description" error={errors.description?.message} fullWidth>
        <textarea
          id="proj-desc"
          rows={3}
          {...register('description')}
          placeholder="Scope, key deliverables, tech stack, and milestone notes..."
          className={`${INPUT_CLASS} resize-y`}
        />
      </FormField>
    </div>
  );
}
