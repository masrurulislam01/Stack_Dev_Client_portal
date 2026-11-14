import {Plus} from 'lucide-react';
import {ConfirmDialog} from '@/components/ui';
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Clients
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Save client organizations and invite clients to set their portal password.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            vm.setPageError(null);
            vm.setEditingClient(null);
            vm.setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Invite Client</span>
        </button>
      </div>

      {vm.displayedError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4"
        >
          <span>{vm.displayedError}</span>
          {vm.pageError && (
            <button
              type="button"
              onClick={() => vm.setPageError(null)}
              className="text-xs font-medium underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
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
        onShowInvite={(client) =>
          vm.setInviteInfo(buildClientInviteInfo(client.id, client.contactName, client.email))
        }
        onEdit={(client) => {
          vm.setPageError(null);
          vm.setEditingClient(client);
          vm.setIsFormOpen(true);
        }}
        onDelete={vm.setDeletingClient}
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
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {vm.deletingClient?.companyName}
            </span>
            ? This removes the client row and linked portal records.
          </>
        }
        confirmLabel="Delete"
        confirmBusyLabel="Deleting..."
        loading={vm.isDeleting}
        onClose={() => vm.setDeletingClient(null)}
        onConfirm={() => void vm.handleDeleteClient()}
      />
    </section>
  );
}
