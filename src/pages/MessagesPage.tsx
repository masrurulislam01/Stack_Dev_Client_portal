import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, ExternalLink, MessageSquare} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ProjectMessagesTab} from '../components/ProjectMessagesTab';
import {useAuth} from '../context/AuthContext';
import {queryKeys} from '../lib/queryKeys';
import {list as listMessages, subscribeToMessages} from '../services/messages';
import {list as listProjects} from '../services/projects';
import {getErrorMessage} from '../services/serviceUtils';
import type {ProjectMessageRecord} from '../types/portal';
import {formatChatTime, toMillis} from '../utils/format';

export function MessagesPage() {
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

  // Realtime subscription ONLY on messages / message_reads
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

  // On desktop, auto-select the first project if none is chosen yet
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
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {getErrorMessage(pageError, 'Unable to load project conversations.')}
        </div>
      )}

      {loadingProjects ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
          <div className="lg:col-span-2 h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        </div>
      ) : threadSummaries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
          <MessageSquare
            className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No project conversations yet
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Once a project is created, you can chat directly inside its Messages tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Conversation List (hidden on mobile when a thread is open) */}
          <div
            className={`lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${
              selectedProject ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Project Threads ({threadSummaries.length})
              </h3>
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[540px] overflow-y-auto">
              {threadSummaries.map(({project, unreadCount, lastMessage}) => {
                const isSelected = project.id === selectedProjectId;
                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`w-full text-left px-4 py-3.5 transition-colors flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isSelected
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {project.title}
                          </p>
                          {lastMessage && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                              {formatChatTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        {user.role === 'admin' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {project.clientName}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {lastMessage
                            ? `${lastMessage.senderName}: ${lastMessage.text || 'Sent an attachment'}`
                            : 'No messages yet'}
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <span className="mt-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-semibold tabular-nums shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Active Thread */}
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
                    to={
                      user.role === 'admin'
                        ? `/admin/projects/${selectedProject.id}?tab=messages`
                        : `/projects/${selectedProject.id}?tab=messages`
                    }
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Open Project</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <ProjectMessagesTab project={selectedProject} user={user} compactHeight />
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
                <MessageSquare
                  className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-2.5"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Select a project conversation
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Choose a thread from the left to view and reply to messages.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
