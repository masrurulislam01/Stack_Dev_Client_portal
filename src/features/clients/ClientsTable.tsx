import {Building2, Pencil, Search, Trash2} from 'lucide-react';
import type {ClientRecord} from '@/types/portal';

interface ClientsTableProps {
  clients: ClientRecord[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onShowInvite: (client: ClientRecord) => void;
  onEdit: (client: ClientRecord) => void;
  onDelete: (client: ClientRecord) => void;
}

export function ClientsTable({
  clients,
  loading,
  searchQuery,
  onSearchChange,
  onShowInvite,
  onEdit,
  onDelete,
}: ClientsTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company, contact, email..."
            aria-label="Search clients"
            className="w-full min-h-[40px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'}
        </span>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
            />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {searchQuery ? 'No matching clients' : 'No clients yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Invite your first client to save their record and generate onboarding instructions.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-6">Company / Workspace</th>
                <th className="py-3 px-4">Client Contact</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Portal Profile</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-6">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {client.companyName}
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {client.id}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-900 dark:text-slate-100">{client.contactName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{client.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
                    {client.phone || '—'}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {client.hasLoginAccount ? (
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Linked
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onShowInvite(client)}
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
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
                        className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(client)}
                        aria-label={`Delete ${client.companyName}`}
                        className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
