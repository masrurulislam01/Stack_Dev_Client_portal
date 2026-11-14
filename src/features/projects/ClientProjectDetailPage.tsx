import {AlertTriangle, ArrowLeft, RefreshCw} from 'lucide-react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {Badge, Button, Card, ErrorAlert} from '@/components/ui';
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_DOT_CLASSES,
} from '@/config/constants';
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
      <section className="space-y-6">
        <Card className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2.5">
            <div className="h-3.5 w-28 rounded skeleton-shimmer" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-72 rounded-lg skeleton-shimmer" />
              <div className="h-6 w-24 rounded-full skeleton-shimmer" />
            </div>
            <div className="h-4 w-48 rounded skeleton-shimmer" />
          </div>
          <div className="w-14 h-14 rounded-full skeleton-shimmer shrink-0" />
        </Card>
        <div className="h-11 w-full rounded-xl skeleton-shimmer" />
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-32 rounded skeleton-shimmer" />
              <div className="h-4 w-10 rounded skeleton-shimmer" />
            </div>
            <div className="h-2 w-full rounded-full skeleton-shimmer" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-1.5">
                <div className="h-3 w-20 rounded skeleton-shimmer" />
                <div className="h-4 w-28 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <div className="h-5 w-28 rounded skeleton-shimmer" />
          <div className="h-16 rounded-xl skeleton-shimmer" />
        </Card>
      </section>
    );
  }

  if (!detail.project || detail.accessDenied) {
    return (
      <Card className="p-10 sm:p-12 text-center space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {detail.projectError ? 'Unable to load project' : 'Project unavailable'}
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          {detail.projectError
            ? getErrorMessage(
                detail.projectError,
                'We could not load this project right now. Please try again.',
              )
            : 'We could not find this project in your workspace, or you do not have permission to view it.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {detail.projectError && !detail.accessDenied && (
            <Button
              type="button"
              variant="secondary"
              disabled={detail.isRetryingProject}
              onClick={detail.refetchProject}
              icon={
                <RefreshCw
                  className={`w-4 h-4 ${detail.isRetryingProject ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
              }
            >
              {detail.isRetryingProject ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:brightness-110 transition-all"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Projects</span>
          </Link>
        </div>
      </Card>
    );
  }

  const {project, user} = detail;
  const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
  const revisionsUsed = Number(project.revisionsUsed) || 0;
  const revisionsAllowed = Number(project.revisionsAllowed) || 0;
  const revisionsExceeded = revisionsUsed > revisionsAllowed;

  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <section className="space-y-6 page-enter">
      <div className="bg-surface rounded-2xl border border-border card-inset p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary-600 mb-2.5 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Projects</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-[28px] sm:leading-[34px] font-bold tracking-tight text-foreground">
              {project.title || 'Untitled Project'}
            </h1>
            <Badge
              dot
              dotClassName={PROJECT_STATUS_DOT_CLASSES[project.status]}
              className={PROJECT_STATUS_BADGE_CLASSES[project.status]}
            >
              {project.status}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-muted capitalize num">
            {project.package || 'custom'} package · Due {formatDateDisplay(project.dueDate)}
          </p>
        </div>

        <div
          className="relative w-14 h-14 flex items-center justify-center shrink-0 self-start sm:self-center"
          aria-label={`Project completion ${progress}%`}
        >
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52" aria-hidden="true">
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              strokeWidth="5"
              className="stroke-surface-muted"
            />
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={
                project.status === 'Delivered'
                  ? 'stroke-success transition-all duration-300'
                  : 'stroke-primary-600 transition-all duration-300'
              }
            />
          </svg>
          <span className="absolute font-mono text-xs font-semibold text-foreground num">
            {progress}%
          </span>
        </div>
      </div>

      {detail.actionError && (
        <ErrorAlert message={detail.actionError} onDismiss={() => detail.setActionError(null)} />
      )}

      {revisionsExceeded && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 flex items-start gap-3 text-sm text-danger-text"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-danger" aria-hidden="true" />
          <div>
            <p className="font-semibold">Included revisions exceeded</p>
            <p className="mt-0.5 text-xs sm:text-sm opacity-90 num">
              {revisionsUsed} of {revisionsAllowed} included revisions have been used. Additional
              revision rounds may incur extra charges.
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
            revisionsUsed={revisionsUsed}
            revisionsAllowed={revisionsAllowed}
            milestones={detail.milestones}
            loading={detail.loadingMilestones}
            error={
              detail.milestonesError
                ? getErrorMessage(detail.milestonesError, 'Unable to load milestones.')
                : null
            }
            onRetry={detail.refetchMilestones}
            retrying={detail.isRetryingMilestones}
            submittingActionId={detail.submittingActionId}
            onApprove={detail.handleApproveMilestone}
            onRequestChanges={detail.handleRequestChanges}
          />
          <Card className="p-6">
            <h3 className="font-heading text-base font-semibold text-foreground mb-2">
              Scope &amp; Description
            </h3>
            <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">
              {project.description || 'No additional project description has been added yet.'}
            </p>
          </Card>
        </div>
      ) : activeTab === 'timeline' ? (
        <TimelineFeed
          updates={detail.updates}
          loading={detail.loadingUpdates}
          error={
            detail.updatesError
              ? getErrorMessage(detail.updatesError, 'Unable to load timeline updates.')
              : null
          }
          onRetry={detail.refetchUpdates}
          retrying={detail.isRetryingUpdates}
          emptyMessage={`No updates have been posted for ${project.title || 'this project'} yet. Check back soon for progress notes and screenshots.`}
          emptyAction={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('messages')}
            >
              Message Stack Dev team
            </Button>
          }
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
