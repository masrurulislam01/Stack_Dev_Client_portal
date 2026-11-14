import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as createInvoice,
  getById as getInvoiceById,
  list as listInvoices,
  markPaid as markInvoicePaid,
  remove as removeInvoice,
  update as updateInvoice,
  type CreateInvoiceInput,
  type ListInvoicesOptions,
  type UpdateInvoiceInput,
} from '@/services/invoices';

export function useInvoices(options: ListInvoicesOptions = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.invoices.list({
      clientId: options.clientId,
      projectId: options.projectId,
    }),
    queryFn: () => listInvoices(options),
    enabled,
  });
}

export function useInvoiceDetail(invoiceId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(invoiceId),
    queryFn: () => getInvoiceById(invoiceId),
    enabled: Boolean(invoiceId) && enabled,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: UpdateInvoiceInput}) =>
      updateInvoice(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.detail(variables.id)});
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      paymentMethod,
      paymentReference,
    }: {
      id: string;
      paymentMethod: string;
      paymentReference?: string;
    }) => markInvoicePaid(id, paymentMethod, paymentReference),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.detail(variables.id)});
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeInvoice(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.prefix});
      void queryClient.invalidateQueries({queryKey: queryKeys.invoices.detail(id)});
    },
  });
}
