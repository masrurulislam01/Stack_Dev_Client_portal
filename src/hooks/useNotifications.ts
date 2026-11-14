import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect} from 'react';
import {queryKeys} from '@/lib/queryKeys';
import {
  list as listNotifications,
  markAllRead,
  markRead,
  subscribeToNotifications,
} from '@/services/notifications';

export function useNotifications(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    return subscribeToNotifications(userId, () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.notifications.list(userId)});
    });
  }, [queryClient, userId]);

  const query = useQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: () => listNotifications(userId),
    enabled: Boolean(userId),
  });

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.notifications.list(userId)});
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllRead(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.notifications.list(userId)});
    },
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    markRead: markOneMutation.mutate,
    markAllRead: markAllMutation.mutate,
  };
}
