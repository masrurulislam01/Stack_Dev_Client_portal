import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Bell, CheckCheck} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ErrorAlert, Skeleton} from '@/components/ui';
import {NotificationItem} from '@/features/notifications/NotificationItem';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {useToast} from '@/hooks/useToast';
import {queryKeys} from '@/lib/queryKeys';
import {
  list as listNotifications,
  markAllRead as markAllNotificationsRead,
  markRead as markNotificationRead,
  subscribeToNotifications,
} from '@/services/notifications';
import {getErrorMessage} from '@/services/serviceUtils';
import type {NotificationRecord} from '@/types/portal';
import {isSafeInternalLink} from '@/types/schemas';

export function NotificationBell() {
  const {user} = useAuth();
  const {t} = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const userId = user?.id ?? '';

  const {
    data: notifications = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: () => listNotifications(userId),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!userId) return;
    return subscribeToNotifications(userId, () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(userId),
      });
    });
  }, [queryClient, userId]);

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      if (!userId) return {previous: undefined};
      const key = queryKeys.notifications.list(userId);
      await queryClient.cancelQueries({queryKey: key});
      const previous = queryClient.getQueryData<NotificationRecord[]>(key);
      queryClient.setQueryData<NotificationRecord[]>(key, (old) =>
        old?.map((item) => (item.id === id ? {...item, read: true} : item)),
      );
      return {previous};
    },
    onError: (_err, _id, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.list(userId), context.previous);
      }
    },
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list(userId),
        });
      }
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onMutate: async () => {
      if (!userId) return {previous: undefined};
      const key = queryKeys.notifications.list(userId);
      await queryClient.cancelQueries({queryKey: key});
      const previous = queryClient.getQueryData<NotificationRecord[]>(key);
      queryClient.setQueryData<NotificationRecord[]>(key, (old) =>
        old?.map((item) => ({...item, read: true})),
      );
      return {previous};
    },
    onError: (err, _vars, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.list(userId), context.previous);
      }
      toast.error(
        'Update failed',
        getErrorMessage(err, 'Unable to mark all notifications as read.'),
      );
    },
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list(userId),
        });
      }
    },
  });

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  const unreadItems = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications],
  );
  const unreadCount = unreadItems.length;

  const handleOpenNotification = async (item: NotificationRecord) => {
    setOpen(false);
    if (!item.read) {
      try {
        await markOneMutation.mutateAsync(item.id);
      } catch {
        // Non-blocking mark-read failure
      }
    }
    if (typeof item.link === 'string' && isSafeInternalLink(item.link)) {
      navigate(item.link);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadItems.length === 0 || markAllMutation.isPending) return;
    markAllMutation.mutate();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`${t.topbar.notifications}${unreadCount > 0 ? ` (${unreadCount} ${t.topbar.newNotificationCount})` : ''}`}
        aria-expanded={open}
        aria-controls="notifications-popover"
        className="relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-border bg-surface text-body hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold num ring-2 ring-surface"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notifications-popover"
          role="region"
          aria-label={t.topbar.notifications}
          className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[4.25rem] sm:top-full sm:mt-2 sm:w-96 bg-surface-raised rounded-2xl border border-border shadow-md z-40 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                {t.topbar.notifications}
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-semibold num">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllMutation.isPending}
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.topbar.markAllRead}</span>
              </button>
            )}
          </div>

          {error && (
            <ErrorAlert
              className="m-3"
              message={getErrorMessage(error, 'Unable to load notifications.')}
              onRetry={() => void refetch()}
              retrying={isFetching && !isLoading}
            />
          )}

          {isLoading ? (
            <ul className="divide-y divide-border">
              {[1, 2, 3].map((row) => (
                <li key={row} className="px-4 py-3.5 flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2.5">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="font-heading text-sm font-semibold text-foreground">
                {t.topbar.noNotifications}
              </p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                {t.topbar.noNotificationsHint}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[65vh] overflow-y-auto">
              {notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onSelect={(selected) => void handleOpenNotification(selected)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
