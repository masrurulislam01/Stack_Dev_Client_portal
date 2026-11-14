import {Plus} from 'lucide-react';
import {Button, ConfirmDialog, ErrorAlert} from '@/components/ui';
import {ClientFormModal} from '@/features/clients/ClientFormModal';
import {ClientInviteCard} from '@/features/clients/ClientInviteCard';
import {ClientsTable} from '@/features/clients/ClientsTable';
import {buildClientInviteInfo} from '@/features/clients/inviteHelpers';
import {useAdminClients} from '@/features/clients/useAdminClients';

export function AdminClientsPage() {
  const vm = useAdminClients();

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground">
            Clients
          </h2>
          <p className="mt-1 text-sm text-muted">
            Save client organizations and invite clients to set their portal password.
          </p>
        </div>

        <Button
          icon={<Plus className="w-4 h-4" aria-hidden="true" />}
          onClick={() => {
            vm.setPageError(null);
            vm.setEditingClient(null);
            vm.setIsFormOpen(true);
          }}
        >
          Invite Client
        </Button>
      </div>

      {vm.displayedError && (
        <ErrorAlert
          message={vm.displayedError}
          onRetry={vm.hasLoadError && !vm.pageError ? vm.refetchClients : undefined}
          retrying={vm.isRetrying}
          onDismiss={vm.pageError ? () => vm.setPageError(null) : undefined}
        />
      )}

      {vm.inviteInfo && (
        <ClientInviteCard
          inviteInfo={vm.inviteInfo}
          onDismiss={() => vm.setInviteInfo(null)}
          onCopyError={vm.setPageError}
        />
      )}

      <ClientsTable
        clients={vm.filteredClients}
        loading={vm.loading}
        searchQuery={vm.searchQuery}
        onSearchChange={vm.setSearchQuery}
        onClearSearch={() => vm.setSearchQuery('')}
        onCreate={() => {
          vm.setPageError(null);
          vm.setEditingClient(null);
          vm.setIsFormOpen(true);
        }}
        onShowInvite={(client) =>
          vm.setInviteInfo(buildClientInviteInfo(client.id, client.contactName, client.email))
        }
        onEdit={(client) => {
          vm.setPageError(null);
          vm.setEditingClient(client);
          vm.setIsFormOpen(true);
        }}
        onDelete={(client) => {
          vm.setDeleteError(null);
          vm.setDeletingClient(client);
        }}
      />

      <ClientFormModal
        isOpen={vm.isFormOpen}
        editingClient={vm.editingClient}
        onClose={() => vm.setIsFormOpen(false)}
        onSave={vm.handleSave}
      />

      <ConfirmDialog
        open={Boolean(vm.deletingClient)}
        title="Delete Client"
        titleId="delete-client-title"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {vm.deletingClient?.companyName || vm.deletingClient?.contactName || 'this client'}
            </span>
            ? This removes the client row and linked portal records.
          </>
        }
        confirmLabel="Delete"
        confirmBusyLabel="Deleting..."
        loading={vm.isDeleting}
        error={vm.deleteError}
        onClose={() => {
          vm.setDeleteError(null);
          vm.setDeletingClient(null);
        }}
        onConfirm={() => void vm.handleDeleteClient()}
      />
    </section>
  );
}
