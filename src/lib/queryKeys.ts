export const queryKeys = {
  clients: {
    all: ['clients'] as const,
  },
  projects: {
    prefix: ['projects'] as const,
    list: (clientId?: string) => ['projects', {clientId: clientId || 'all'}] as const,
    detail: (projectId: string) => ['project', projectId] as const,
  },
  milestones: {
    prefix: ['milestones'] as const,
    list: (projectId?: string) => ['milestones', {projectId: projectId || 'all'}] as const,
  },
  updates: {
    prefix: ['updates'] as const,
    list: (options?: {projectId?: string; clientId?: string; limit?: number}) =>
      [
        'updates',
        {
          projectId: options?.projectId || 'all',
          clientId: options?.clientId || 'all',
          limit: options?.limit ?? null,
        },
      ] as const,
  },
  files: {
    prefix: ['files'] as const,
    list: (options?: {projectId?: string; clientId?: string}) =>
      [
        'files',
        {
          projectId: options?.projectId || 'all',
          clientId: options?.clientId || 'all',
        },
      ] as const,
  },
  messages: {
    prefix: ['messages'] as const,
    list: (options?: {projectId?: string; clientId?: string}) =>
      [
        'messages',
        {
          projectId: options?.projectId || 'all',
          clientId: options?.clientId || 'all',
        },
      ] as const,
    unreadPrefix: ['unread-messages-count'] as const,
    unreadCount: (options: {userId: string; clientId?: string; projectId?: string}) =>
      [
        'unread-messages-count',
        {
          userId: options.userId,
          clientId: options.clientId || 'all',
          projectId: options.projectId || 'all',
        },
      ] as const,
  },
  invoices: {
    prefix: ['invoices'] as const,
    list: (options?: {clientId?: string; projectId?: string}) =>
      [
        'invoices',
        {
          clientId: options?.clientId || 'all',
          projectId: options?.projectId || 'all',
        },
      ] as const,
    detail: (invoiceId: string) => ['invoice', invoiceId] as const,
  },
  payments: {
    prefix: ['payment-submissions'] as const,
    list: (invoiceId?: string) =>
      ['payment-submissions', {invoiceId: invoiceId || 'all'}] as const,
    byTranId: (tranId: string) => ['payment-submission-tran', tranId] as const,
  },
  notifications: {
    list: (userId: string) => ['notifications', userId] as const,
  },
};
