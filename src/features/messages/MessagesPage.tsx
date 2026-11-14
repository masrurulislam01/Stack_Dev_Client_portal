import {ArrowLeft, ExternalLink, MessageSquare} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Card, EmptyState, ErrorAlert, Skeleton} from '@/components/ui';
import {MessagesThreadList} from '@/features/messages/MessagesThreadList';
import {ProjectMessagesTab} from '@/features/messages/ProjectMessagesTab';
import {useMessagesInbox} from '@/features/messages/useMessagesInbox';
import {getErrorMessage} from '@/services/serviceUtils';

function MessagesInboxSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <Card className="lg:col-span-4 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-border">
          <Skeleton className="h-3.5 w-32" />
        </div>
        <ul className="divide-y divide-border">
          {[1, 2, 3, 4].map((row) => (
            <li key={row} className="px-4 py-3.5 flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="hidden lg:flex lg:col-span-8 overflow-hidden flex-col">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="h-[380px] sm:h-[460px] px-5 py-4 space-y-4 bg-background/60">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-14 w-2/3 rounded-2xl" />
          </div>
          <div className="flex flex-col items-end space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12 w-1/2 rounded-2xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-16 w-3/4 rounded-2xl" />
          </div>
        </div>
        <div className="border-t border-border p-4 flex items-center gap-2">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-20 rounded-xl" />
        </div>
      </Card>
    </div>
  );
}

export function MessagesPage() {
  const vm = useMessagesInbox();
  if (!vm.user) return null;

  const projectsPath = vm.user.role === 'admin' ? '/admin/projects' : '/projects';

  return (
    <section className="space-y-6 page-enter">
      <div>
        <h1 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground">
          Messages
        </h1>
        <p className="text-sm text-muted mt-1">
          Real-time project conversations with file attachments. Opening a thread marks unread messages as read.
        </p>
      </div>

      {vm.pageError && (
        <ErrorAlert
          message={getErrorMessage(vm.pageError, 'Unable to load project conversations.')}
          onRetry={vm.refetchPage}
          retrying={vm.retrying}
        />
      )}

      {vm.loadingProjects ? (
        <MessagesInboxSkeleton />
      ) : vm.threadSummaries.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-5 h-5" aria-hidden="true" />}
          title="No project conversations yet"
          description="Once a project is created, you can chat directly inside its Messages tab."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {vm.pageError && (
                <button
                  type="button"
                  onClick={vm.refetchPage}
                  disabled={vm.retrying}
                  className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-xl border border-border-strong bg-surface text-xs font-semibold text-foreground hover:bg-surface-muted disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {vm.retrying ? 'Retrying...' : 'Retry'}
                </button>
              )}
              <Link
                to={projectsPath}
                className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-semibold hover:brightness-110 transition-all"
              >
                View Projects
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <MessagesThreadList
            summaries={vm.threadSummaries}
            selectedProjectId={vm.selectedProjectId}
            onSelect={vm.setSelectedProjectId}
            isAdmin={vm.user.role === 'admin'}
            hiddenOnMobile={Boolean(vm.selectedProject)}
          />

          <div
            className={`lg:col-span-8 space-y-3 ${vm.selectedProject ? 'block' : 'hidden lg:block'}`}
          >
            {vm.selectedProject ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => vm.setSelectedProjectId(null)}
                    className="lg:hidden inline-flex items-center gap-1.5 min-h-[36px] text-xs font-semibold text-muted hover:text-foreground cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>All Threads</span>
                  </button>

                  <Link
                    to={
                      vm.user.role === 'admin'
                        ? `/admin/projects/${vm.selectedProject.id}?tab=messages`
                        : `/projects/${vm.selectedProject.id}?tab=messages`
                    }
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    <span>Open Project</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <ProjectMessagesTab project={vm.selectedProject} user={vm.user} compactHeight />
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
