import {ArrowLeft, ExternalLink, MessageSquare} from 'lucide-react';
import {Link} from 'react-router-dom';
import {MessagesThreadList} from '@/features/messages/MessagesThreadList';
import {ProjectMessagesTab} from '@/features/messages/ProjectMessagesTab';
import {useMessagesInbox} from '@/features/messages/useMessagesInbox';
import {getErrorMessage} from '@/services/serviceUtils';

export function MessagesPage() {
  const vm = useMessagesInbox();
  if (!vm.user) return null;

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

      {vm.pageError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {getErrorMessage(vm.pageError, 'Unable to load project conversations.')}
        </div>
      )}

      {vm.loadingProjects ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
          <div className="lg:col-span-2 h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        </div>
      ) : vm.threadSummaries.length === 0 ? (
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
                    className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Open Project</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <ProjectMessagesTab project={vm.selectedProject} user={vm.user} compactHeight />
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
