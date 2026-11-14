import {AlertTriangle, ArrowLeft, RefreshCw} from 'lucide-react';
import {useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {Button, Card, ErrorAlert} from '@/components/ui';
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
      <section className="space-y-6">
        <Card className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2.5">
            <div className="h-3.5 w-28 rounded skeleton-shimmer" />
            <div className="h-7 w-72 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-52 rounded skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full skeleton-shimmer" />
            <div className="h-11 w-32 rounded-xl skeleton-shimmer" />
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-border">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="space-y-1.5">
                <div className="h-3 w-20 rounded skeleton-shimmer" />
                <div className="h-4 w-32 rounded skeleton-shimmer" />
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

  if (!detail.project) {
    return (
      <Card className="p-10 text-center space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {detail.projectError ? 'Unable to load project' : 'Project not found'}
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto">
          {detail.projectError
            ? getErrorMessage(
                detail.projectError,
                'This project could not be loaded right now. Please try again.',
              )
            : 'This project may have been deleted or does not exist.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {detail.projectError && (
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
            to="/admin/projects"
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
  const revisionsUsed = Number(project.revisionsUsed) || 0;
  const revisionsAllowed = Number(project.revisionsAllowed) || 0;
  const revisionsExceeded = revisionsUsed > revisionsAllowed;

  return (
    <section className="space-y-6 page-enter">
      <AdminProjectHeader project={project} onEdit={() => setIsEditOpen(true)} />

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
            <p className="font-semibold">Revision limit exceeded</p>
            <p className="mt-0.5 text-xs sm:text-sm opacity-90 num">
              {revisionsUsed} revisions have been used out of {revisionsAllowed} allowed for this
              package.
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
            error={
              detail.milestonesError
                ? getErrorMessage(detail.milestonesError, 'Unable to load milestones.')
                : null
            }
            onRetry={detail.refetchMilestones}
            retrying={detail.isRetryingMilestones}
            updatingMilestoneId={detail.updatingMilestoneId}
            onOpenAddModal={() => setIsMilestoneModalOpen(true)}
            onStatusChange={(m, next) => void detail.handleMilestoneStatusChange(m, next)}
            onDelete={detail.handleDeleteMilestone}
          />
          <Card className="p-6">
            <h3 className="font-heading text-base font-semibold text-foreground mb-2">
              Project Description
            </h3>
            <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">
              {project.description || 'No description provided for this project yet.'}
            </p>
          </Card>
        </div>
      ) : activeTab === 'timeline' ? (
        <div className="space-y-6">
          <TimelineUpdateComposer onPostUpdate={detail.handlePostUpdate} />
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
            onDeleteUpdate={detail.handleDeleteUpdate}
            emptyAction={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById('timeline-message')?.focus()}
              >
                Write first update
              </Button>
            }
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
