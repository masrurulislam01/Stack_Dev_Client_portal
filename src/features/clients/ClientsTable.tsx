import {Building2, Pencil, Plus, Search, Trash2} from 'lucide-react';
import {Badge, Button} from '@/components/ui';
import type {ClientRecord} from '@/types/portal';
import {getAvatarToneClass, getInitials} from '@/utils/avatar';

interface ClientsTableProps {
  clients: ClientRecord[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch?: () => void;
  onCreate?: () => void;
  onShowInvite: (client: ClientRecord) => void;
  onEdit: (client: ClientRecord) => void;
  onDelete: (client: ClientRecord) => void;
}

export function ClientsTable({
  clients,
  loading,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onCreate,
  onShowInvite,
  onEdit,
  onDelete,
}: ClientsTableProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border card-inset overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company, contact, email..."
            aria-label="Search clients"
            className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl border border-border hover:border-border-strong bg-surface text-sm text-foreground placeholder:text-subtle transition-colors focus:outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-ring"
          />
        </div>

        <span className="text-xs font-medium text-muted num">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'}
        </span>
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-muted">
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="py-3.5 px-6">Company / Workspace</th>
                <th className="py-3.5 px-4">Client Contact</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Portal Profile</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4].map((row) => (
                <tr key={row} className="h-14">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-40 rounded-lg skeleton-shimmer" />
                        <div className="h-3 w-24 rounded-lg skeleton-shimmer" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 rounded-lg skeleton-shimmer" />
                      <div className="h-3 w-44 rounded-lg skeleton-shimmer" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3.5 w-28 rounded-lg skeleton-shimmer" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-6 w-20 rounded-full skeleton-shimmer" />
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
                      <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : clients.length === 0 ? (
        <div className="p-12 text-center space-y-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {searchQuery ? 'No matching clients' : 'No clients yet'}
            </h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search query or clear the search filter.'
                : 'Invite your first client to save their record and generate onboarding instructions.'}
            </p>
          </div>
          {searchQuery && onClearSearch ? (
            <Button variant="secondary" size="sm" onClick={onClearSearch}>
              Clear search
            </Button>
          ) : (
            !searchQuery &&
            onCreate && (
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" aria-hidden="true" />}
                onClick={onCreate}
              >
                Invite Client
              </Button>
            )
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-muted">
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="py-3.5 px-6">Company / Workspace</th>
                <th className="py-3.5 px-4">Client Contact</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Portal Profile</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {clients.map((client) => {
                const displayName = client.companyName || client.contactName || 'Unnamed Client';
                const avatarTone = getAvatarToneClass(displayName);
                const initials = getInitials(displayName);

                return (
                  <tr
                    key={client.id}
                    className="h-14 hover:bg-surface-muted/60 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          aria-hidden="true"
                          className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0 select-none ${avatarTone}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{displayName}</div>
                          <div className="text-xs font-mono text-muted truncate">{client.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-foreground font-medium">
                        {client.contactName || '—'}
                      </div>
                      <div className="text-xs text-muted">{client.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-body font-mono text-xs num whitespace-nowrap">
                      {client.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {client.hasLoginAccount ? (
                        <Badge tone="success" dot>
                          Linked
                        </Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onShowInvite(client)}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                        >
                          Show Invite &amp; SQL
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(client)}
                          aria-label={`Edit ${client.companyName}`}
                          className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(client)}
                          aria-label={`Delete ${client.companyName}`}
                          className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-danger-text hover:bg-danger-soft transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
