import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect} from 'react';
import {queryKeys} from '@/lib/queryKeys';
import {countUnread, list as listMessages, subscribeToMessages} from '@/services/messages';

export function useUnreadMessagesCount(options: {
  userId: string;
  viewerRole: 'admin' | 'client';
  clientId?: string;
  projectId?: string;
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!options.userId) return;
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
    }, options.projectId);
  }, [queryClient, options.userId, options.projectId]);

  return useQuery({
    queryKey: queryKeys.messages.unreadCount({
      userId: options.userId,
      clientId: options.clientId,
      projectId: options.projectId,
    }),
    queryFn: () =>
      countUnread({
        viewerId: options.userId,
        viewerRole: options.viewerRole,
        clientId: options.clientId,
        projectId: options.projectId,
      }),
    enabled: options.enabled ?? Boolean(options.userId),
  });
}

export function useProjectMessages(options: {
  projectId: string;
  viewerId?: string;
  viewerName?: string;
  viewerRole?: 'admin' | 'client';
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!options.projectId) return;
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list({projectId: options.projectId}),
      });
      void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
    }, options.projectId);
  }, [options.projectId, queryClient]);

  return useQuery({
    queryKey: queryKeys.messages.list({projectId: options.projectId}),
    queryFn: () =>
      listMessages({
        projectId: options.projectId,
        viewerId: options.viewerId,
        viewerName: options.viewerName,
        viewerRole: options.viewerRole,
      }),
    enabled: options.enabled ?? Boolean(options.projectId),
  });
}
