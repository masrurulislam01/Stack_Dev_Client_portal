import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {Modal} from '@/components/ui';
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
    if (editingClient) {
      reset({
        companyName: editingClient.companyName,
        contactName: editingClient.contactName,
        phone: editingClient.phone,
        email: editingClient.email,
        notes: editingClient.notes,
      });
    } else {
      reset({companyName: '', contactName: '', phone: '', email: '', notes: ''});
    }
  }, [isOpen, editingClient, reset]);

  const onSubmit = async (values: ClientFormParsed) => {
    await onSave(values);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={editingClient ? 'Edit Client' : 'Invite Client'}
      titleId="client-modal-title"
      maxWidthClass="max-w-lg"
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="c-contact"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Client Name
            </label>
            <input
              id="c-contact"
              type="text"
              {...register('contactName')}
              placeholder="e.g. Tariq Hasan"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
            {errors.contactName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.contactName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="c-email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="c-email"
              type="email"
              {...register('email')}
              placeholder="client@company.com"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="c-company"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Company Name <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="c-company"
              type="text"
              {...register('companyName')}
              placeholder="Defaults to client name"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="c-phone"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Phone <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="c-phone"
              type="tel"
              {...register('phone')}
              placeholder="+880 1711-000000"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="c-notes"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Notes <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="c-notes"
            rows={2}
            {...register('notes')}
            placeholder="Billing preferences or internal notes..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.notes.message}</p>
          )}
        </div>

        {!editingClient && (
          <p className="text-xs text-slate-600 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
            Saving creates the client record and generates a copyable invite message telling the
            client to use <strong>Forgot password?</strong> on the portal login page.
          </p>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            {isSubmitting
              ? 'Saving...'
              : editingClient
                ? 'Save Changes'
                : 'Save & Generate Invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
