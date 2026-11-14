import {AlertTriangle, ArrowLeft} from 'lucide-react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {PROJECT_STATUS_BADGE_CLASSES} from '@/config/constants';
import {ProjectFilesTab} from '@/features/files/ProjectFilesTab';
import {ProjectInvoicesTab} from '@/features/invoices/ProjectInvoicesTab';
import {ProjectMessagesTab} from '@/features/messages/ProjectMessagesTab';
import {ClientMilestonesCard} from '@/features/milestones/ClientMilestonesCard';
import {ProjectOverviewSummaryCard} from '@/features/projects/ProjectOverviewSummaryCard';
import {ProjectTabsNav, type ProjectDetailTab} from '@/features/projects/ProjectTabsNav';
import {useClientProjectDetail} from '@/features/projects/useClientProjectDetail';
import {TimelineFeed} from '@/features/updates/TimelineFeed';
import {getErrorMessage} from '@/services/serviceUtils';
import {formatDateDisplay} from '@/utils/format';

export function ClientProjectDetailPage() {
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

  const detail = useClientProjectDetail(projectId);

  if (detail.loadingProject) {
    return (
      <section className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-72 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      </section>
    );
  }

  if (!detail.project || detail.accessDenied) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Project unavailable
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {detail.projectError
            ? getErrorMessage(
                detail.projectError,
                'We could not find this project in your workspace, or you do not have permission to view it.',
              )
            : 'We could not find this project in your workspace, or you do not have permission to view it.'}
        </p>
        <Link
          to="/projects"
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
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Projects</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {project.title}
          </h2>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
          >
            {project.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 capitalize">
          {project.package} package · Due {formatDateDisplay(project.dueDate)}
        </p>
      </div>

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
            <p className="font-semibold">Included revisions exceeded</p>
            <p className="mt-0.5 text-xs sm:text-sm text-red-700 dark:text-red-300/90 tabular-nums">
              {project.revisionsUsed} of {project.revisionsAllowed} included revisions have been
              used. Additional revision rounds may incur extra charges.
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
          <ProjectOverviewSummaryCard project={project} variant="client" />
          <ClientMilestonesCard
            projectStatus={project.status}
            revisionsUsed={project.revisionsUsed}
            revisionsAllowed={project.revisionsAllowed}
            milestones={detail.milestones}
            loading={detail.loadingMilestones}
            submittingActionId={detail.submittingActionId}
            onApprove={detail.handleApproveMilestone}
            onRequestChanges={detail.handleRequestChanges}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Scope &amp; Description
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
              {project.description || 'No additional project description has been added yet.'}
            </p>
          </div>
        </div>
      ) : activeTab === 'timeline' ? (
        <TimelineFeed
          updates={detail.updates}
          loading={detail.loadingUpdates}
          emptyMessage={`No updates have been posted for ${project.title} yet. Check back soon for progress notes and screenshots.`}
        />
      ) : activeTab === 'files' && user ? (
        <ProjectFilesTab project={project} user={user} />
      ) : activeTab === 'messages' && user ? (
        <ProjectMessagesTab project={project} user={user} />
      ) : activeTab === 'invoices' && user ? (
        <ProjectInvoicesTab project={project} user={user} />
      ) : null}
    </section>
  );
}
