import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect, useMemo, useState} from 'react';
import type {ThreadSummary} from '@/features/messages/MessagesThreadList';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {list as listMessages, subscribeToMessages} from '@/services/messages';
import {list as listProjects} from '@/services/projects';
import type {ProjectMessageRecord} from '@/types/portal';
import {toMillis} from '@/utils/format';

export function useMessagesInbox() {
  const {user} = useAuth();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const clientFilterId = isAdmin ? undefined : user?.clientId || undefined;

  const {
    data: projects = [],
    isLoading: loadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: queryKeys.projects.list(clientFilterId),
    queryFn: async () => {
      const list = await listProjects({clientId: clientFilterId});
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    },
    enabled: Boolean(user && (isAdmin || user.clientId)),
  });

  const {data: messages = [], error: messagesError} = useQuery({
    queryKey: queryKeys.messages.list({clientId: clientFilterId}),
    queryFn: () =>
      listMessages({
        clientId: clientFilterId,
        viewerId: user?.id,
        viewerName: user?.name,
        viewerRole: user?.role,
      }),
    enabled: Boolean(user && (isAdmin || user.clientId)),
  });

  useEffect(() => {
    if (!user?.id) return;
    return subscribeToMessages(() => {
      void Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.messages.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix}),
      ]);
    });
  }, [user?.id, queryClient]);

  const threadSummaries = useMemo<ThreadSummary[]>(() => {
    const byProject = new Map<
      string,
      {unreadCount: number; lastMessage?: ProjectMessageRecord}
    >();

    for (const msg of messages) {
      const current = byProject.get(msg.projectId) ?? {unreadCount: 0};
      const isUnread = user?.role === 'admin' ? !msg.readByAdmin : !msg.readByClient;
      if (isUnread) current.unreadCount += 1;
      if (!current.lastMessage || toMillis(msg.createdAt) >= toMillis(current.lastMessage.createdAt)) {
        current.lastMessage = msg;
      }
      byProject.set(msg.projectId, current);
    }

    const enriched = projects.map((project) => {
      const stats = byProject.get(project.id);
      return {
        project,
        unreadCount: stats?.unreadCount ?? 0,
        lastMessage: stats?.lastMessage,
        sortMs: stats?.lastMessage ? toMillis(stats.lastMessage.createdAt) : 0,
      };
    });

    enriched.sort((a, b) => {
      if (b.sortMs !== a.sortMs) return b.sortMs - a.sortMs;
      return a.project.title.localeCompare(b.project.title);
    });

    return enriched;
  }, [projects, messages, user?.role]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (
      !selectedProjectId &&
      threadSummaries.length > 0 &&
      typeof window !== 'undefined' &&
      window.innerWidth >= 1024
    ) {
      setSelectedProjectId(threadSummaries[0].project.id);
    }
  }, [selectedProjectId, threadSummaries]);

  return {
    user,
    loadingProjects,
    pageError: projectsError || messagesError,
    threadSummaries,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
  };
}
