import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as createClient,
  list as listClients,
  remove as removeClient,
  update as updateClient,
  type CreateClientInput,
  type UpdateClientInput,
} from '@/services/clients';

export function useClients(enabled = true) {
  return useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: listClients,
    enabled,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => createClient(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.clients.all});
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: UpdateClientInput}) =>
      updateClient(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.clients.all});
      void queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix});
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeClient(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.clients.all});
    },
  });
}
