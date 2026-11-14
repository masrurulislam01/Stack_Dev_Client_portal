import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {list as listClients} from '@/services/clients';
import {countUnread, subscribeToMessages} from '@/services/messages';
import {
  create as createMilestone,
  list as listMilestones,
  remove as removeMilestone,
  update as updateMilestone,
} from '@/services/milestones';
import {getById as getProjectById, update as updateProject} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import {create as createUpdate, list as listUpdates, remove as removeUpdate} from '@/services/updates';
import type {
  MilestoneFormParsed,
  MilestoneRecord,
  MilestoneStatus,
  ProjectFormParsed,
} from '@/types/portal';
import {createNotification} from '@/utils/notifications';

export function useAdminProjectDetail(projectId: string | undefined) {
  const {user} = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);

  const {
    data: project = null,
    isLoading: loading,
    error: projectError,
  } = useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: () => getProjectById(projectId ?? ''),
    enabled: Boolean(projectId),
  });

  const {data: clients = []} = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => listClients(),
    enabled: Boolean(projectId),
  });

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

  const {data: unreadMessages = 0} = useQuery({
    queryKey: queryKeys.messages.unreadCount({userId: user?.id ?? '', projectId}),
    queryFn: () => countUnread({viewerId: user?.id ?? '', viewerRole: 'admin', projectId}),
    enabled: Boolean(projectId && user?.id),
  });

  useEffect(() => {
    if (!projectId || !user?.id) return;
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
    }, projectId);
  }, [projectId, user?.id, queryClient]);

  const handleSaveProject = async (values: ProjectFormParsed) => {
    if (!projectId || !user || user.role !== 'admin') return;
    setActionError(null);
    const actorName = user.name || 'Stack Dev';
    const updateMessage = `Updated to ${values.status} stage (${values.progress}% complete).`;
    try {
      await updateProject(projectId, values);
      await createUpdate({
        projectId,
        authorId: user.id,
        message: updateMessage,
        attachments: [],
      });
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(projectId)}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix}),
      ]);
      await createNotification({
        recipientRole: 'client',
        clientId: values.clientId,
        projectId,
        type: 'update',
        title: `Project update: ${values.title}`,
        body: updateMessage,
        link: `/projects/${projectId}?tab=timeline`,
        actorUid: user.id,
        actorName,
      });
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update project.'));
      throw err;
    }
  };

  const handleAddMilestone = async (values: MilestoneFormParsed) => {
    if (!project || !user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await createMilestone({
        projectId: project.id,
        title: values.title,
        description: values.description,
        dueDate: values.dueDate,
        status: values.status,
      });
      await queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix});
      if (values.status === 'In Review') {
        await createNotification({
          recipientRole: 'client',
          clientId: project.clientId,
          projectId: project.id,
          type: 'milestone',
          title: `Milestone ready for review: ${values.title}`,
          body: `${project.title} has a milestone awaiting your approval.`,
          link: `/projects/${project.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to add milestone.'));
      throw err;
    }
  };

  const handleMilestoneStatusChange = async (
    milestone: MilestoneRecord,
    nextStatus: MilestoneStatus,
  ) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    setUpdatingMilestoneId(milestone.id);
    const shouldResetReviewMeta = nextStatus === 'Pending' || nextStatus === 'In Review';
    try {
      await updateMilestone(milestone.id, {
        status: nextStatus,
        resetReviewMeta: shouldResetReviewMeta,
      });
      await queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix});
      if (nextStatus === 'In Review' && milestone.status !== 'In Review' && project) {
        await createNotification({
          recipientRole: 'client',
          clientId: project.clientId,
          projectId: project.id,
          type: 'milestone',
          title: `Milestone ready for review: ${milestone.title}`,
          body: `${project.title} has a milestone awaiting your approval.`,
          link: `/projects/${project.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
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
      await createUpdate({
        projectId: project.id,
        authorId: user.id,
        message,
        attachments,
      });
      await queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix});
      await createNotification({
        recipientRole: 'client',
        clientId: project.clientId,
        projectId: project.id,
        type: 'update',
        title: `New timeline update: ${project.title}`,
        body: message,
        link: `/projects/${project.id}?tab=timeline`,
        actorUid: user.id,
        actorName: user.name,
      });
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

  return {
    user,
    project,
    clients,
    milestones,
    updates,
    unreadMessages,
    loading,
    loadingMilestones,
    loadingUpdates,
    projectError,
    actionError,
    setActionError,
    updatingMilestoneId,
    handleSaveProject,
    handleAddMilestone,
    handleMilestoneStatusChange,
    handleDeleteMilestone,
    handlePostUpdate,
    handleDeleteUpdate,
  };
}
