import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, ExternalLink, MessageSquare} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {EmptyState} from '@/components/ui';
import {MessagesThreadList} from '@/features/messages/MessagesThreadList';
import {ProjectMessagesTab} from '@/features/messages/ProjectMessagesTab';
import {useAuth, useProjects} from '@/hooks';
import {queryKeys} from '@/lib/queryKeys';
import {list as listMessages, subscribeToMessages} from '@/services/messages';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ProjectMessageRecord} from '@/types/portal';
import {toMillis} from '@/utils/format';

export function MessagesPage() {
  const {user} = useAuth();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const clientFilterId = isAdmin ? undefined : user?.clientId || undefined;
  const enabled = Boolean(user && (isAdmin || user.clientId));

  const {data: rawProjects = [], isLoading: loadingProjects, error: projectsError} = useProjects(
    clientFilterId,
    enabled,
  );
  const projects = useMemo(
    () => [...rawProjects].sort((a, b) => a.title.localeCompare(b.title)),
    [rawProjects],
  );

  const {data: messages = [], error: messagesError} = useQuery({
    queryKey: queryKeys.messages.list({clientId: clientFilterId}),
    queryFn: () =>
      listMessages({
        clientId: clientFilterId,
        viewerId: user?.id,
        viewerName: user?.name,
        viewerRole: user?.role,
      }),
    enabled,
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

  const threadSummaries = useMemo(() => {
    const byProject = new Map<string, {unreadCount: number; lastMessage?: ProjectMessageRecord}>();
    for (const msg of messages) {
      const current = byProject.get(msg.projectId) ?? {unreadCount: 0};
      const isUnread = user?.role === 'admin' ? !msg.readByAdmin : !msg.readByClient;
      if (isUnread) current.unreadCount += 1;
      if (!current.lastMessage || toMillis(msg.createdAt) >= toMillis(current.lastMessage.createdAt)) {
        current.lastMessage = msg;
      }
      byProject.set(msg.projectId, current);
    }

    return projects
      .map((project) => {
        const stats = byProject.get(project.id);
        return {
          project,
          unreadCount: stats?.unreadCount ?? 0,
          lastMessage: stats?.lastMessage,
          sortMs: stats?.lastMessage ? toMillis(stats.lastMessage.createdAt) : 0,
        };
      })
      .sort((a, b) => (b.sortMs !== a.sortMs ? b.sortMs - a.sortMs : a.project.title.localeCompare(b.project.title)));
  }, [projects, messages, user?.role]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (!selectedProjectId && threadSummaries.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSelectedProjectId(threadSummaries[0].project.id);
    }
  }, [selectedProjectId, threadSummaries]);

  if (!user) return null;

  const pageError = projectsError || messagesError;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Messages
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time project conversations with file attachments. Opening a thread marks unread messages as read.
        </p>
      </div>

      {pageError && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {getErrorMessage(pageError, 'Unable to load project conversations.')}
        </div>
      )}

      {loadingProjects ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
          <div className="lg:col-span-2 h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        </div>
      ) : threadSummaries.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-5 h-5" aria-hidden="true" />}
          title="No project conversations yet"
          description="Once a project is created, you can chat directly inside its Messages tab."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <MessagesThreadList
            threads={threadSummaries}
            selectedProjectId={selectedProjectId}
            hasSelectedProject={Boolean(selectedProject)}
            viewerRole={user.role}
            onSelectProject={setSelectedProjectId}
          />

          <div className={`lg:col-span-8 space-y-3 ${selectedProject ? 'block' : 'hidden lg:block'}`}>
            {selectedProject ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(null)}
                    className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>All Threads</span>
                  </button>

                  <Link
                    to={isAdmin ? `/admin/projects/${selectedProject.id}?tab=messages` : `/projects/${selectedProject.id}?tab=messages`}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Open Project</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <ProjectMessagesTab project={selectedProject} user={user} compactHeight />
              </>
            ) : (
              <EmptyState
                icon={<MessageSquare className="w-5 h-5" aria-hidden="true" />}
                title="Select a project conversation"
                description="Choose a thread from the left to view and reply to messages."
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
