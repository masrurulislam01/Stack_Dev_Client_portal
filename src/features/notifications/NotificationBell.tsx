import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Bell, CheckCheck} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {NotificationItem} from '@/features/notifications/NotificationItem';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {queryKeys} from '@/lib/queryKeys';
import {
  list as listNotifications,
  markAllRead as markAllNotificationsRead,
  markRead as markNotificationRead,
  subscribeToNotifications,
} from '@/services/notifications';
import type {NotificationRecord} from '@/types/portal';

export function NotificationBell() {
  const {user} = useAuth();
  const {t} = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const userId = user?.id ?? '';

  const {data: notifications = []} = useQuery({
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
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list(userId),
        });
      }
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => {
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
    if (item.link.startsWith('/') && !item.link.startsWith('//')) {
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
        className="relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold tabular-nums ring-2 ring-white dark:ring-slate-900"
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
          className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[4.25rem] sm:top-full sm:mt-2 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-40 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.topbar.notifications}
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 text-[11px] font-semibold tabular-nums">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllMutation.isPending}
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.topbar.markAllRead}</span>
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {t.topbar.noNotifications}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.topbar.noNotificationsHint}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[65vh] overflow-y-auto">
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
