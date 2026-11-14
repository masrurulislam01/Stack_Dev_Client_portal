import {Plus} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Button, ConfirmDialog} from '@/components/ui';
import {ClientFormModal} from '@/features/clients/ClientFormModal';
import {ClientInviteBanner} from '@/features/clients/ClientInviteBanner';
import {ClientsTable} from '@/features/clients/ClientsTable';
import {buildClientInviteInfo, type ClientInviteInfo} from '@/features/clients/inviteHelpers';
import {
  useAuth,
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from '@/hooks';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ClientFormParsed, ClientRecord} from '@/types/portal';

export function AdminClientsPage() {
  const {user, profile} = useAuth();
  const isAdmin = (profile?.role ?? user?.role) === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientRecord | null>(null);
  const [inviteInfo, setInviteInfo] = useState<ClientInviteInfo | null>(null);

  const {data: clients = [], isLoading: loading, error: loadError} = useClients(isAdmin);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  const handleSave = async (values: ClientFormParsed) => {
    if (!isAdmin) {
      setPageError('Only administrators can manage client records.');
      return;
    }
    setPageError(null);

    const payload = {
      companyName: values.companyName.trim() || values.contactName.trim(),
      contactName: values.contactName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
      notes: values.notes.trim(),
    };

    try {
      if (editingClient) {
        await updateMutation.mutateAsync({id: editingClient.id, input: payload});
        setIsFormOpen(false);
        return;
      }
      const created = await createMutation.mutateAsync(payload);
      setIsFormOpen(false);
      setInviteInfo(buildClientInviteInfo(created.id, created.contactName, created.email));
    } catch (err) {
      setPageError(getErrorMessage(err, 'Unable to save client record.'));
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClient || !isAdmin) return;
    setPageError(null);
    try {
      await deleteMutation.mutateAsync(deletingClient.id);
      setDeletingClient(null);
    } catch (err) {
      setPageError(getErrorMessage(err, 'Unable to delete client.'));
    }
  };

  const displayedError =
    pageError || (loadError ? getErrorMessage(loadError, 'Unable to load client records.') : null);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Clients
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Save client organizations and invite clients to set their portal password.
          </p>
        </div>

        <Button
          onClick={() => {
            setPageError(null);
            setEditingClient(null);
            setIsFormOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
        >
          Invite Client
        </Button>
      </div>

      {displayedError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4"
        >
          <span>{displayedError}</span>
          {pageError && (
            <button
              type="button"
              onClick={() => setPageError(null)}
              className="text-xs font-medium underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {inviteInfo && (
        <ClientInviteBanner
          inviteInfo={inviteInfo}
          onDismiss={() => setInviteInfo(null)}
          onCopyError={(msg) => setPageError(msg)}
        />
      )}

      <ClientsTable
        clients={filteredClients}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onShowInvite={(client) =>
          setInviteInfo(buildClientInviteInfo(client.id, client.contactName, client.email))
        }
        onEdit={(client) => {
          setPageError(null);
          setEditingClient(client);
          setIsFormOpen(true);
        }}
        onDelete={(client) => setDeletingClient(client)}
      />

      <ClientFormModal
        isOpen={isFormOpen}
        editingClient={editingClient}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        onConfirm={() => void handleDeleteClient()}
        title="Delete Client"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {deletingClient?.companyName}
            </span>
            ? This removes the client row and linked portal records.
          </>
        }
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        loading={deleteMutation.isPending}
      />
    </section>
  );
}
