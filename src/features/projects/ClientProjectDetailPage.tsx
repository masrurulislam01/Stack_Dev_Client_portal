import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft} from 'lucide-react';
import {useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ProjectFilesTab} from '@/features/files/ProjectFilesTab';
import {ProjectInvoicesTab} from '@/features/invoices/ProjectInvoicesTab';
import {ProjectMessagesTab} from '@/features/messages/ProjectMessagesTab';
import {ProjectMilestonesTab} from '@/features/milestones/ProjectMilestonesTab';
import {ProjectHeaderCard} from '@/features/projects/ProjectHeaderCard';
import {ProjectOverviewTab} from '@/features/projects/ProjectOverviewTab';
import {ProjectTabsNav, type ProjectDetailTab} from '@/features/projects/ProjectTabsNav';
import {TimelineFeed} from '@/features/updates/TimelineFeed';
import {useAuth, useProjectDetail, useUnreadMessagesCount} from '@/hooks';
import {queryKeys} from '@/lib/queryKeys';
import {list as listMilestones, submitClientReview} from '@/services/milestones';
import {getErrorMessage} from '@/services/serviceUtils';
import {list as listUpdates} from '@/services/updates';
import type {MilestoneRecord} from '@/types/portal';
import {createNotification} from '@/utils/notifications';

const parseTab = (value: string | null): ProjectDetailTab =>
  value === 'timeline' || value === 'files' || value === 'messages' || value === 'invoices'
    ? value
    : 'overview';

export function ClientProjectDetailPage() {
  const {projectId} = useParams<{projectId: string}>();
  const {user} = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get('tab'));
  const setActiveTab = (tab: ProjectDetailTab) =>
    setSearchParams(tab === 'overview' ? {} : {tab}, {replace: true});

  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingActionId, setSubmittingActionId] = useState<string | null>(null);
  const clientId = user?.clientId ?? '';

  const {data: rawProject = null, isLoading: loadingProject, error: projectError} = useProjectDetail(
    projectId ?? '',
    Boolean(projectId && clientId),
  );
  const accessDenied = Boolean(rawProject && rawProject.clientId !== clientId);
  const project = rawProject && !accessDenied ? rawProject : null;

  const {data: milestones = [], isLoading: loadingMilestones} = useQuery({
    queryKey: queryKeys.milestones.list(projectId),
    queryFn: () => listMilestones({projectId}),
    enabled: Boolean(projectId && project),
  });
  const {data: updates = [], isLoading: loadingUpdates} = useQuery({
    queryKey: queryKeys.updates.list({projectId}),
    queryFn: () => listUpdates({projectId}),
    enabled: Boolean(projectId && project),
  });
  const {data: unreadMessages = 0} = useUnreadMessagesCount({
    userId: user?.id ?? '',
    viewerRole: 'client',
    clientId,
    projectId,
    enabled: Boolean(projectId && project && user?.id),
  });

  const invalidateReviewQueries = (targetProjectId: string) =>
    Promise.all([
      queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix}),
      queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(targetProjectId)}),
      queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
    ]);

  const handleApproveMilestone = async (milestone: MilestoneRecord) => {
    if (!user || !project) return;
    setActionError(null);
    setSubmittingActionId(milestone.id);
    try {
      await submitClientReview(milestone.id, 'Approved');
      await invalidateReviewQueries(project.id);
      await createNotification({recipientRole: 'admin', clientId: project.clientId, projectId: project.id, type: 'milestone', title: `Milestone approved: ${milestone.title}`, body: `${user.name} approved "${milestone.title}" on ${project.title}.`, link: `/admin/projects/${project.id}`, actorUid: user.id, actorName: user.name});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to approve milestone.'));
    } finally {
      setSubmittingActionId(null);
    }
  };

  const handleRequestChanges = async (milestone: MilestoneRecord, comment: string) => {
    if (!user || !project) return;
    setActionError(null);
    setSubmittingActionId(milestone.id);
    try {
      await submitClientReview(milestone.id, 'Changes Requested', comment);
      await invalidateReviewQueries(project.id);
      await createNotification({recipientRole: 'admin', clientId: project.clientId, projectId: project.id, type: 'milestone', title: `Changes requested: ${milestone.title}`, body: `${user.name} requested changes on ${project.title}: "${comment}"`, link: `/admin/projects/${project.id}`, actorUid: user.id, actorName: user.name});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to submit revision request.'));
      throw err;
    } finally {
      setSubmittingActionId(null);
    }
  };

  if (loadingProject) {
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

  if (!project || accessDenied) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project unavailable</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {projectError ? getErrorMessage(projectError, 'We could not find this project in your workspace, or you do not have permission to view it.') : 'We could not find this project in your workspace, or you do not have permission to view it.'}
        </p>
        <Link to="/projects" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /><span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <ProjectHeaderCard project={project} mode="client" backTo="/projects" actionError={actionError} onDismissError={() => setActionError(null)} />
      <ProjectTabsNav activeTab={activeTab} unreadMessages={unreadMessages} onSelectTab={setActiveTab} />

      {activeTab === 'overview' ? (
        <ProjectOverviewTab
          project={project}
          mode="client"
          milestonesSection={
            <ProjectMilestonesTab
              project={project}
              milestones={milestones}
              loading={loadingMilestones}
              mode="client"
              busyMilestoneId={submittingActionId}
              onApproveMilestone={handleApproveMilestone}
              onRequestChanges={handleRequestChanges}
            />
          }
        />
      ) : activeTab === 'timeline' ? (
        <TimelineFeed updates={updates} loading={loadingUpdates} emptyMessage={`No updates have been posted for ${project.title} yet. Check back soon for progress notes and screenshots.`} />
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
