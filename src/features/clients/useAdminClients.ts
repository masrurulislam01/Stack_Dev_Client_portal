import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useMemo, useState} from 'react';
import {buildClientInviteInfo, type ClientInviteInfo} from '@/features/clients/inviteHelpers';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as createClient,
  list as listClients,
  remove as removeClient,
  update as updateClient,
} from '@/services/clients';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ClientFormParsed, ClientRecord} from '@/types/portal';

export function useAdminClients() {
  const {user, profile} = useAuth();
  const isAdmin = (profile?.role ?? user?.role) === 'admin';
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientRecord | null>(null);
  const [inviteInfo, setInviteInfo] = useState<ClientInviteInfo | null>(null);

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
      const payload = {
        companyName: cleanCompanyName,
        contactName: cleanContactName,
        phone: values.phone.trim(),
        email: cleanEmail,
        notes: values.notes.trim(),
      };

      if (editingClient) {
        const updated = await updateClient(editingClient.id, payload);
        return {mode: 'edit' as const, record: updated};
      }
      const created = await createClient(payload);
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
    try {
      const result = await saveMutation.mutateAsync(values);
      setIsFormOpen(false);
      if (result.mode === 'create') {
        setInviteInfo(
          buildClientInviteInfo(result.record.id, result.record.contactName, result.record.email),
        );
      }
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

  return {
    filteredClients,
    loading,
    searchQuery,
    setSearchQuery,
    pageError,
    setPageError,
    displayedError,
    isFormOpen,
    setIsFormOpen,
    editingClient,
    setEditingClient,
    deletingClient,
    setDeletingClient,
    inviteInfo,
    setInviteInfo,
    isDeleting: deleteMutation.isPending,
    handleSave,
    handleDeleteClient,
  };
}
