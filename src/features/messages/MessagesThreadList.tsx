import {Card} from '@/components/ui';
import type {ProjectMessageRecord, ProjectRecord} from '@/types/portal';
import {getAvatarToneClass, getInitials} from '@/utils/avatar';
import {formatChatTime} from '@/utils/format';

export interface ThreadSummary {
  project: ProjectRecord;
  unreadCount: number;
  lastMessage?: ProjectMessageRecord;
  sortMs: number;
}

interface MessagesThreadListProps {
  summaries: ThreadSummary[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
  isAdmin: boolean;
  hiddenOnMobile: boolean;
}

export function MessagesThreadList({
  summaries,
  selectedProjectId,
  onSelect,
  isAdmin,
  hiddenOnMobile,
}: MessagesThreadListProps) {
  return (
    <Card className={`lg:col-span-4 overflow-hidden ${hiddenOnMobile ? 'hidden lg:block' : 'block'}`}>
      <div className="px-4 py-3.5 border-b border-border bg-surface-muted/60">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Project Threads ({summaries.length})
        </h2>
      </div>
      <ul className="divide-y divide-border max-h-[540px] overflow-y-auto">
        {summaries.map(({project, unreadCount, lastMessage}) => {
          const isSelected = project.id === selectedProjectId;
          const seedName = isAdmin
            ? project.clientName || project.title || 'Project'
            : project.title || 'Stack Dev';

          return (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => onSelect(project.id)}
                className={`w-full text-left px-4 py-3.5 transition-colors flex items-start justify-between gap-3 cursor-pointer border-l-[3px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring ${
                  isSelected
                    ? 'bg-primary-50/80 border-l-primary-600'
                    : 'border-l-transparent hover:bg-surface-muted/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${getAvatarToneClass(
                    seedName,
                  )}`}
                  aria-hidden="true"
                >
                  {getInitials(seedName)}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-primary-700' : 'text-foreground'
                      }`}
                    >
                      {project.title || 'Untitled Project'}
                    </p>
                    {lastMessage && (
                      <span className="text-[11px] text-subtle num shrink-0">
                        {formatChatTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <p className="text-xs font-medium text-muted truncate">
                      {project.clientName || 'Client'}
                    </p>
                  )}

                  <p className="text-xs text-muted truncate">
                    {lastMessage
                      ? `${lastMessage.senderName || 'User'}: ${lastMessage.text || 'Sent an attachment'}`
                      : 'No messages yet'}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <span className="mt-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-600 text-white text-[11px] font-semibold num shrink-0">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
