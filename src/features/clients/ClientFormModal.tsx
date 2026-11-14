import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Input, Modal, Textarea} from '@/components/ui';
import {
  clientFormSchema,
  type ClientFormParsed,
  type ClientFormValues,
  type ClientRecord,
} from '@/types/portal';

export interface ClientFormModalProps {
  isOpen: boolean;
  editingClient: ClientRecord | null;
  onClose: () => void;
  onSave: (values: ClientFormParsed) => Promise<void>;
}

export function ClientFormModal({
  isOpen,
  editingClient,
  onClose,
  onSave,
}: ClientFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<ClientFormValues, unknown, ClientFormParsed>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      companyName: editingClient?.companyName ?? '',
      contactName: editingClient?.contactName ?? '',
      phone: editingClient?.phone ?? '',
      email: editingClient?.email ?? '',
      notes: editingClient?.notes ?? '',
    });
  }, [isOpen, editingClient, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingClient ? 'Edit Client' : 'Invite Client'}
      size="md"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="c-contact"
            label="Client Name"
            placeholder="e.g. Tariq Hasan"
            error={errors.contactName?.message}
            {...register('contactName')}
          />
          <Input
            id="c-email"
            label="Email Address"
            type="email"
            placeholder="client@company.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="c-company"
            label="Company Name"
            optionalLabel="(optional)"
            placeholder="Defaults to client name"
            error={errors.companyName?.message}
            {...register('companyName')}
          />
          <Input
            id="c-phone"
            label="Phone"
            optionalLabel="(optional)"
            type="tel"
            placeholder="+880 1711-000000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <Textarea
          id="c-notes"
          label="Notes"
          optionalLabel="(optional)"
          rows={2}
          placeholder="Billing preferences or internal notes..."
          error={errors.notes?.message}
          {...register('notes')}
        />

        {!editingClient && (
          <p className="text-xs text-slate-600 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
            Saving creates the client record and generates a copyable invite message telling the
            client to use <strong>Forgot password?</strong> on the portal login page.
          </p>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : editingClient
                ? 'Save Changes'
                : 'Save & Generate Invite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
