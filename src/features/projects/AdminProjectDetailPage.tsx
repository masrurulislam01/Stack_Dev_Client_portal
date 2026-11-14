import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft} from 'lucide-react';
import {useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ProjectFilesTab} from '@/features/files/ProjectFilesTab';
import {ProjectInvoicesTab} from '@/features/invoices/ProjectInvoicesTab';
import {ProjectMessagesTab} from '@/features/messages/ProjectMessagesTab';
import {MilestoneFormModal} from '@/features/milestones/MilestoneFormModal';
import {ProjectMilestonesTab} from '@/features/milestones/ProjectMilestonesTab';
import {ProjectFormModal} from '@/features/projects/ProjectFormModal';
import {ProjectHeaderCard} from '@/features/projects/ProjectHeaderCard';
import {ProjectOverviewTab} from '@/features/projects/ProjectOverviewTab';
import {ProjectTabsNav, type ProjectDetailTab} from '@/features/projects/ProjectTabsNav';
import {TimelineFeed} from '@/features/updates/TimelineFeed';
import {UpdateComposer} from '@/features/updates/UpdateComposer';
import {useAuth, useClients, useProjectDetail, useUnreadMessagesCount} from '@/hooks';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as createMilestone,
  list as listMilestones,
  remove as removeMilestone,
  update as updateMilestone,
} from '@/services/milestones';
import {update as updateProject} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import {create as createUpdate, list as listUpdates, remove as removeUpdate} from '@/services/updates';
import type {MilestoneFormParsed, MilestoneRecord, MilestoneStatus, ProjectFormParsed} from '@/types/portal';
import {createNotification} from '@/utils/notifications';

const parseTab = (value: string | null): ProjectDetailTab =>
  value === 'timeline' || value === 'files' || value === 'messages' || value === 'invoices'
    ? value
    : 'overview';

export function AdminProjectDetailPage() {
  const {projectId} = useParams<{projectId: string}>();
  const {user} = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get('tab'));
  const setActiveTab = (tab: ProjectDetailTab) =>
    setSearchParams(tab === 'overview' ? {} : {tab}, {replace: true});

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);

  const {data: project = null, isLoading: loading, error: projectError} = useProjectDetail(projectId ?? '');
  const {data: clients = []} = useClients(Boolean(projectId));
  const {data: milestones = [], isLoading: loadingMilestones} = useQuery({
    queryKey: queryKeys.milestones.list(projectId),
    queryFn: () => listMilestones({projectId}),
    enabled: Boolean(projectId),
  });
  const {data: updates = [], isLoading: loadingUpdates} = useQuery({
    queryKey: queryKeys.updates.list({projectId}),
    queryFn: () => listUpdates({projectId}),
    enabled: Boolean(projectId),
  });
  const {data: unreadMessages = 0} = useUnreadMessagesCount({
    userId: user?.id ?? '',
    viewerRole: 'admin',
    projectId,
    enabled: Boolean(projectId && user?.id),
  });

  const handleSaveProject = async (values: ProjectFormParsed) => {
    if (!projectId || !user || user.role !== 'admin') return;
    setActionError(null);
    const updateMessage = `Updated to ${values.status} stage (${values.progress}% complete).`;
    try {
      await updateProject(projectId, values);
      await createUpdate({projectId, authorId: user.id, message: updateMessage, attachments: []});
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(projectId)}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix}),
      ]);
      await createNotification({recipientRole: 'client', clientId: values.clientId, projectId, type: 'update', title: `Project update: ${values.title}`, body: updateMessage, link: `/projects/${projectId}?tab=timeline`, actorUid: user.id, actorName: user.name || 'Stack Dev'});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update project.'));
      throw err;
    }
  };

  const handleAddMilestone = async (values: MilestoneFormParsed) => {
    if (!project || !user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await createMilestone({projectId: project.id, ...values});
      await queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix});
      if (values.status === 'In Review') {
        await createNotification({recipientRole: 'client', clientId: project.clientId, projectId: project.id, type: 'milestone', title: `Milestone ready for review: ${values.title}`, body: `${project.title} has a milestone awaiting your approval.`, link: `/projects/${project.id}`, actorUid: user.id, actorName: user.name});
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to add milestone.'));
      throw err;
    }
  };

  const handleMilestoneStatusChange = async (milestone: MilestoneRecord, nextStatus: MilestoneStatus) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    setUpdatingMilestoneId(milestone.id);
    try {
      await updateMilestone(milestone.id, {status: nextStatus, resetReviewMeta: nextStatus === 'Pending' || nextStatus === 'In Review'});
      await queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix});
      if (nextStatus === 'In Review' && milestone.status !== 'In Review' && project) {
        await createNotification({recipientRole: 'client', clientId: project.clientId, projectId: project.id, type: 'milestone', title: `Milestone ready for review: ${milestone.title}`, body: `${project.title} has a milestone awaiting your approval.`, link: `/projects/${project.id}`, actorUid: user.id, actorName: user.name});
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update milestone status.'));
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await removeMilestone(milestoneId);
      await queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to delete milestone.'));
    }
  };

  const handlePostUpdate = async (message: string, attachments: string[]) => {
    if (!project || !user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await createUpdate({projectId: project.id, authorId: user.id, message, attachments});
      await queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix});
      await createNotification({recipientRole: 'client', clientId: project.clientId, projectId: project.id, type: 'update', title: `New timeline update: ${project.title}`, body: message, link: `/projects/${project.id}?tab=timeline`, actorUid: user.id, actorName: user.name});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to post update.'));
      throw err;
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await removeUpdate(updateId);
      await queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to delete update.'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project not found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {projectError ? getErrorMessage(projectError, 'This project may have been deleted or does not exist.') : 'This project may have been deleted or does not exist.'}
        </p>
        <Link to="/admin/projects" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /><span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <ProjectHeaderCard project={project} mode="admin" backTo="/admin/projects" actionError={actionError} onDismissError={() => setActionError(null)} onEditProject={() => setIsEditOpen(true)} />
      <ProjectTabsNav activeTab={activeTab} unreadMessages={unreadMessages} onSelectTab={setActiveTab} />

      {activeTab === 'overview' ? (
        <ProjectOverviewTab
          project={project}
          mode="admin"
          milestonesSection={
            <ProjectMilestonesTab
              project={project}
              milestones={milestones}
              loading={loadingMilestones}
              mode="admin"
              busyMilestoneId={updatingMilestoneId}
              onOpenAddModal={() => setIsMilestoneModalOpen(true)}
              onStatusChange={(m, status) => void handleMilestoneStatusChange(m, status)}
              onDeleteMilestone={(id) => void handleDeleteMilestone(id)}
            />
          }
        />
      ) : activeTab === 'timeline' ? (
        <div className="space-y-6">
          <UpdateComposer onPost={handlePostUpdate} />
          <TimelineFeed updates={updates} loading={loadingUpdates} onDeleteUpdate={handleDeleteUpdate} />
        </div>
      ) : activeTab === 'files' && user ? (
        <ProjectFilesTab project={project} user={user} />
      ) : activeTab === 'messages' && user ? (
        <ProjectMessagesTab project={project} user={user} />
      ) : activeTab === 'invoices' && user ? (
        <ProjectInvoicesTab project={project} user={user} clients={clients} />
      ) : null}

      <ProjectFormModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={handleSaveProject} clients={clients} initialProject={project} />
      <MilestoneFormModal isOpen={isMilestoneModalOpen} onClose={() => setIsMilestoneModalOpen(false)} onSubmitMilestone={handleAddMilestone} />
    </section>
  );
}
