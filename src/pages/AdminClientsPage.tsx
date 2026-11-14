import {zodResolver} from '@hookform/resolvers/zod';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  Building2,
  Check,
  Copy,
  MailPlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {useAuth} from '../context/AuthContext';
import {queryKeys} from '../lib/queryKeys';
import {
  create as createClient,
  list as listClients,
  remove as removeClient,
  update as updateClient,
} from '../services/clients';
import {getErrorMessage} from '../services/serviceUtils';
import {
  clientFormSchema,
  type ClientFormParsed,
  type ClientFormValues,
  type ClientRecord,
} from '../types/portal';

interface ClientInviteInfo {
  clientId: string;
  name: string;
  email: string;
  inviteMessage: string;
  linkSqlSnippet: string;
}

function buildClientInviteInfo(
  clientId: string,
  name: string,
  email: string,
): ClientInviteInfo {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://your-portal-url';
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const escapedName = cleanName.replace(/'/g, "''");
  const escapedEmail = cleanEmail.replace(/'/g, "''");

  const inviteMessage = [
    `Hi ${cleanName},`,
    '',
    'Your Stack Dev Client Portal account is ready.',
    `1. Open the portal: ${origin}/login`,
    '2. Click "Forgot password?"',
    `3. Enter your email (${cleanEmail}) to receive a password reset link and set your password.`,
    '',
    '— Stack Dev, Savar, Dhaka',
  ].join('\n');

  const linkSqlSnippet = [
    'update public.profiles',
    `set client_id = '${clientId}',`,
    `    full_name = '${escapedName}'`,
    `where lower(email) = lower('${escapedEmail}');`,
  ].join('\n');

  return {
    clientId,
    name: cleanName,
    email: cleanEmail,
    inviteMessage,
    linkSqlSnippet,
  };
}

export function AdminClientsPage() {
  const {user, profile} = useAuth();
  const isAdmin = (profile?.role ?? user?.role) === 'admin';
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientRecord | null>(
    null,
  );

  const [inviteInfo, setInviteInfo] = useState<ClientInviteInfo | null>(null);
  const [copiedField, setCopiedField] = useState<'invite' | 'sql' | null>(null);

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

  const {
    data: clients = [],
    isLoading: loading,
    error: loadError,
  } = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => listClients(),
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ClientFormParsed) => {
      const cleanEmail = values.email.trim().toLowerCase();
      const cleanContactName = values.contactName.trim();
      const cleanCompanyName = values.companyName.trim() || cleanContactName;

      if (editingClient) {
        const updated = await updateClient(editingClient.id, {
          companyName: cleanCompanyName,
          contactName: cleanContactName,
          phone: values.phone.trim(),
          email: cleanEmail,
          notes: values.notes.trim(),
        });
        return {mode: 'edit' as const, record: updated};
      }

      const created = await createClient({
        companyName: cleanCompanyName,
        contactName: cleanContactName,
        phone: values.phone.trim(),
        email: cleanEmail,
        notes: values.notes.trim(),
      });
      return {mode: 'create' as const, record: created};
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: queryKeys.clients.all});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeClient(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: queryKeys.clients.all});
    },
  });

  const isDeleting = deleteMutation.isPending;

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

  useEffect(() => {
    if (!isFormOpen && !deletingClient) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (deletingClient && !isDeleting) {
        setDeletingClient(null);
      } else if (isFormOpen && !isSubmitting) {
        setIsFormOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFormOpen, isSubmitting, deletingClient, isDeleting]);

  const openInviteModal = () => {
    setPageError(null);
    setEditingClient(null);
    reset({
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (client: ClientRecord) => {
    setPageError(null);
    setEditingClient(client);
    reset({
      companyName: client.companyName,
      contactName: client.contactName,
      phone: client.phone,
      email: client.email,
      notes: client.notes,
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: ClientFormParsed) => {
    if (!isAdmin) {
      setPageError('Only administrators can manage client records.');
      return;
    }
    setPageError(null);

    try {
      const result = await saveMutation.mutateAsync(values);
      setIsFormOpen(false);
      if (result.mode === 'create') {
        setInviteInfo(
          buildClientInviteInfo(
            result.record.id,
            result.record.contactName,
            result.record.email,
          ),
        );
      }
    } catch (err) {
      setPageError(
        getErrorMessage(err, 'Unable to save client record.'),
      );
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

  const copyText = async (text: string, field: 'invite' | 'sql') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setPageError(
        'Clipboard access was denied. Please copy the text manually.',
      );
    }
  };

  const displayedError =
    pageError || (loadError ? getErrorMessage(loadError, 'Unable to load client records.') : null);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Clients
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Save client organizations and invite clients to set their portal
            password.
          </p>
        </div>

        <button
          type="button"
          onClick={openInviteModal}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Invite Client</span>
        </button>
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

      {/* Copyable Client Invite & Admin Linking Instructions */}
      {inviteInfo && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
              <MailPlus className="w-5 h-5 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold">
                  Invite ready for {inviteInfo.name} ({inviteInfo.email})
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Client row saved. Copy the invite message for the client and
                  create/link their Auth user in Supabase Dashboard.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInviteInfo(null)}
              aria-label="Dismiss invite panel"
              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  1. Copyable Message for Client
                </span>
                <button
                  type="button"
                  onClick={() => copyText(inviteInfo.inviteMessage, 'invite')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  {copiedField === 'invite' ? (
                    <>
                      <Check
                        className="w-3.5 h-3.5 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy message</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {inviteInfo.inviteMessage}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  2. Link Profile After Adding User in Supabase Dashboard
                </span>
                <button
                  type="button"
                  onClick={() => copyText(inviteInfo.linkSqlSnippet, 'sql')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  {copiedField === 'sql' ? (
                    <>
                      <Check
                        className="w-3.5 h-3.5 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                {inviteInfo.linkSqlSnippet}
              </pre>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                In Supabase Dashboard → Authentication → Users → Add user (check
                Auto Confirm User), then run the SQL above in the SQL Editor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Table Card */}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, contact, email..."
              aria-label="Search clients"
              className="w-full min-h-[40px] pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredClients.length}{' '}
            {filteredClients.length === 1 ? 'client' : 'clients'}
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
        ) : filteredClients.length === 0 ? (
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
                {filteredClients.map((client) => (
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
                      <div className="text-slate-900 dark:text-slate-100">
                        {client.contactName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {client.email}
                      </div>
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
                          onClick={() =>
                            setInviteInfo(
                              buildClientInviteInfo(
                                client.id,
                                client.contactName,
                                client.email,
                              ),
                            )
                          }
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
                          onClick={() => openEditModal(client)}
                          aria-label={`Edit ${client.companyName}`}
                          className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingClient(client)}
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

      {/* Invite / Edit Client Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-modal-title"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3
                id="client-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {editingClient ? 'Edit Client' : 'Invite Client'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close modal"
                className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 space-y-4"
              noValidate
            >
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
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="c-company"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Company Name{' '}
                    <span className="text-xs font-normal text-slate-400">
                      (optional)
                    </span>
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
                    Phone{' '}
                    <span className="text-xs font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="+880 1711-000000"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="c-notes"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Notes{' '}
                  <span className="text-xs font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="c-notes"
                  rows={2}
                  {...register('notes')}
                  placeholder="Billing preferences or internal notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
                />
                {errors.notes && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {!editingClient && (
                <p className="text-xs text-slate-600 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
                  Saving creates the client record and generates a copyable
                  invite message telling the client to use{' '}
                  <strong>Forgot password?</strong> on the portal login page.
                </p>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-client-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <h3
              id="delete-client-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Delete Client
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {deletingClient.companyName}
              </span>
              ? This removes the client row and linked portal records.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClient(null)}
                disabled={isDeleting}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
