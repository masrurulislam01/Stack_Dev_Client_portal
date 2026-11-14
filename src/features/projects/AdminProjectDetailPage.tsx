import {AlertTriangle, ArrowLeft} from 'lucide-react';
import {useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ProjectFilesTab} from '@/features/files/ProjectFilesTab';
import {ProjectInvoicesTab} from '@/features/invoices/ProjectInvoicesTab';
import {ProjectMessagesTab} from '@/features/messages/ProjectMessagesTab';
import {AdminMilestonesCard} from '@/features/milestones/AdminMilestonesCard';
import {MilestoneFormModal} from '@/features/milestones/MilestoneFormModal';
import {AdminProjectHeader} from '@/features/projects/AdminProjectHeader';
import {ProjectFormModal} from '@/features/projects/ProjectFormModal';
import {ProjectOverviewSummaryCard} from '@/features/projects/ProjectOverviewSummaryCard';
import {ProjectTabsNav, type ProjectDetailTab} from '@/features/projects/ProjectTabsNav';
import {useAdminProjectDetail} from '@/features/projects/useAdminProjectDetail';
import {TimelineFeed} from '@/features/updates/TimelineFeed';
import {TimelineUpdateComposer} from '@/features/updates/TimelineUpdateComposer';
import {getErrorMessage} from '@/services/serviceUtils';

export function AdminProjectDetailPage() {
  const {projectId} = useParams<{projectId: string}>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: ProjectDetailTab =
    tabParam === 'timeline' ||
    tabParam === 'files' ||
    tabParam === 'messages' ||
    tabParam === 'invoices'
      ? tabParam
      : 'overview';
  const setActiveTab = (tab: ProjectDetailTab) => {
    setSearchParams(tab === 'overview' ? {} : {tab}, {replace: true});
  };

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  const detail = useAdminProjectDetail(projectId);

  if (detail.loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!detail.project) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Project not found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {detail.projectError
            ? getErrorMessage(
                detail.projectError,
                'This project may have been deleted or does not exist.',
              )
            : 'This project may have been deleted or does not exist.'}
        </p>
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const {project, user} = detail;
  const revisionsExceeded = project.revisionsUsed > project.revisionsAllowed;

  return (
    <section className="space-y-6">
      <AdminProjectHeader project={project} onEdit={() => setIsEditOpen(true)} />

      {detail.actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4"
        >
          <span>{detail.actionError}</span>
          <button
            type="button"
            onClick={() => detail.setActionError(null)}
            className="text-xs font-medium underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {revisionsExceeded && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-5 py-4 flex items-start gap-3 text-sm text-red-800 dark:text-red-300"
        >
          <AlertTriangle
            className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Revision limit exceeded</p>
            <p className="mt-0.5 text-xs sm:text-sm text-red-700 dark:text-red-300/90 tabular-nums">
              {project.revisionsUsed} revisions have been used out of {project.revisionsAllowed}{' '}
              allowed for this package.
            </p>
          </div>
        </div>
      )}

      <ProjectTabsNav
        activeTab={activeTab}
        unreadMessages={detail.unreadMessages}
        onSelectTab={setActiveTab}
      />

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <ProjectOverviewSummaryCard project={project} variant="admin" />
          <AdminMilestonesCard
            milestones={detail.milestones}
            loading={detail.loadingMilestones}
            updatingMilestoneId={detail.updatingMilestoneId}
            onOpenAddModal={() => setIsMilestoneModalOpen(true)}
            onStatusChange={(m, next) => void detail.handleMilestoneStatusChange(m, next)}
            onDelete={(id) => void detail.handleDeleteMilestone(id)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Project Description
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
              {project.description || 'No description provided for this project yet.'}
            </p>
          </div>
        </div>
      ) : activeTab === 'timeline' ? (
        <div className="space-y-6">
          <TimelineUpdateComposer onPostUpdate={detail.handlePostUpdate} />
          <TimelineFeed
            updates={detail.updates}
            loading={detail.loadingUpdates}
            onDeleteUpdate={detail.handleDeleteUpdate}
          />
        </div>
      ) : activeTab === 'files' && user ? (
        <ProjectFilesTab project={project} user={user} />
      ) : activeTab === 'messages' && user ? (
        <ProjectMessagesTab project={project} user={user} />
      ) : activeTab === 'invoices' && user ? (
        <ProjectInvoicesTab project={project} user={user} clients={detail.clients} />
      ) : null}

      <ProjectFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={detail.handleSaveProject}
        clients={detail.clients}
        initialProject={project}
      />

      <MilestoneFormModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onAddMilestone={async (values) => {
          await detail.handleAddMilestone(values);
          setIsMilestoneModalOpen(false);
        }}
      />
    </section>
  );
}
