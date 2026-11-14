import type {ProjectMessageRecord, ProjectRecord} from '@/types/portal';
import {formatChatTime} from '@/utils/format';

export interface MessageThreadSummary {
  project: ProjectRecord;
  unreadCount: number;
  lastMessage?: ProjectMessageRecord;
  sortMs: number;
}

interface MessagesThreadListProps {
  threads: MessageThreadSummary[];
  selectedProjectId: string | null;
  hasSelectedProject: boolean;
  viewerRole: 'admin' | 'client';
  onSelectProject: (projectId: string) => void;
}

export function MessagesThreadList({
  threads,
  selectedProjectId,
  hasSelectedProject,
  viewerRole,
  onSelectProject,
}: MessagesThreadListProps) {
  return (
    <div
      className={`lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${
        hasSelectedProject ? 'hidden lg:block' : 'block'
      }`}
    >
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Project Threads ({threads.length})
        </h3>
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[540px] overflow-y-auto">
        {threads.map(({project, unreadCount, lastMessage}) => {
          const isSelected = project.id === selectedProjectId;
          return (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => onSelectProject(project.id)}
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

                  {viewerRole === 'admin' && (
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
  );
}
