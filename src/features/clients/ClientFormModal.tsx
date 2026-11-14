import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Modal} from '@/components/ui';
import {getErrorMessage} from '@/services/serviceUtils';
import {
  clientFormSchema,
  type ClientFormParsed,
  type ClientFormValues,
  type ClientRecord,
} from '@/types/portal';

interface ClientFormModalProps {
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<ClientFormValues, unknown, ClientFormParsed>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {companyName: '', contactName: '', phone: '', email: '', notes: ''},
  });

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    if (editingClient) {
      reset({
        companyName: editingClient.companyName ?? '',
        contactName: editingClient.contactName ?? '',
        phone: editingClient.phone ?? '',
        email: editingClient.email ?? '',
        notes: editingClient.notes ?? '',
      });
    } else {
      reset({companyName: '', contactName: '', phone: '', email: '', notes: ''});
    }
  }, [isOpen, editingClient, reset]);

  const onSubmit = async (values: ClientFormParsed) => {
    setSubmitError(null);
    try {
      await onSave(values);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to save client record.'));
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={editingClient ? 'Edit Client' : 'Invite Client'}
      titleId="client-modal-title"
      maxWidthClass="max-w-[520px]"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}
        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-75">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="c-contact"
                className="block text-[13px] font-semibold text-foreground mb-1.5"
              >
                Client Name
              </label>
              <input
                id="c-contact"
                type="text"
                {...register('contactName')}
                placeholder="e.g. Tariq Hasan"
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
                  errors.contactName
                    ? 'border-danger focus:border-danger'
                    : 'border-border hover:border-border-strong focus:border-primary-600'
                }`}
              />
              {errors.contactName && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.contactName.message}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="c-email"
                className="block text-[13px] font-semibold text-foreground mb-1.5"
              >
                Email Address
              </label>
              <input
                id="c-email"
                type="email"
                {...register('email')}
                placeholder="client@company.com"
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-surface text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
                  errors.email
                    ? 'border-danger focus:border-danger'
                    : 'border-border hover:border-border-strong focus:border-primary-600'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="c-company"
                className="block text-[13px] font-semibold text-foreground mb-1.5"
              >
                Company Name <span className="text-xs font-normal text-subtle">(optional)</span>
              </label>
              <input
                id="c-company"
                type="text"
                {...register('companyName')}
                placeholder="Defaults to client name"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-border hover:border-border-strong bg-surface text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-ring"
              />
              {errors.companyName && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.companyName.message}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="c-phone"
                className="block text-[13px] font-semibold text-foreground mb-1.5"
              >
                Phone <span className="text-xs font-normal text-subtle">(optional)</span>
              </label>
              <input
                id="c-phone"
                type="tel"
                {...register('phone')}
                placeholder="+880 1711-000000"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-border hover:border-border-strong bg-surface text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-ring"
              />
              {errors.phone && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.phone.message}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="c-notes"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              Notes <span className="text-xs font-normal text-subtle">(optional)</span>
            </label>
            <textarea
              id="c-notes"
              rows={2}
              {...register('notes')}
              placeholder="Billing preferences or internal notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border hover:border-border-strong bg-surface text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-ring resize-y"
            />
            {errors.notes && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.notes.message}</span>
              </p>
            )}
          </div>

          {!editingClient && (
            <p className="text-xs text-muted rounded-xl bg-surface-muted border border-border px-3.5 py-2.5 leading-relaxed">
              Saving creates the client record and generates a copyable invite message telling the
              client to use <strong className="text-foreground">Forgot password?</strong> on the
              portal login page.
            </p>
          )}
        </fieldset>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" disabled={isSubmitting} onClick={onClose}>
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
