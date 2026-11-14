import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {countUnread, subscribeToMessages} from '@/services/messages';
import {list as listMilestones, submitClientReview} from '@/services/milestones';
import {getById as getProjectById} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import {list as listUpdates} from '@/services/updates';
import type {MilestoneRecord} from '@/types/portal';
import {createNotification} from '@/utils/notifications';

export function useClientProjectDetail(projectId: string | undefined) {
  const {user} = useAuth();
  const queryClient = useQueryClient();
  const clientId = user?.clientId ?? '';

  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingActionId, setSubmittingActionId] = useState<string | null>(null);

  const {
    data: rawProject = null,
    isLoading: loadingProject,
    isFetching: fetchingProject,
    error: projectError,
    refetch: refetchProject,
  } = useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: () => getProjectById(projectId ?? ''),
    enabled: Boolean(projectId && clientId),
  });

  const accessDenied = Boolean(rawProject && rawProject.clientId !== clientId);
  const project = rawProject && !accessDenied ? rawProject : null;

  const {
    data: milestones = [],
    isLoading: loadingMilestones,
    isFetching: fetchingMilestones,
    error: milestonesError,
    refetch: refetchMilestones,
  } = useQuery({
    queryKey: queryKeys.milestones.list(projectId),
    queryFn: () => listMilestones({projectId}),
    enabled: Boolean(projectId && project),
  });

  const {
    data: updates = [],
    isLoading: loadingUpdates,
    isFetching: fetchingUpdates,
    error: updatesError,
    refetch: refetchUpdates,
  } = useQuery({
    queryKey: queryKeys.updates.list({projectId}),
    queryFn: () => listUpdates({projectId}),
    enabled: Boolean(projectId && project),
  });

  const {data: unreadMessages = 0} = useQuery({
    queryKey: queryKeys.messages.unreadCount({
      userId: user?.id ?? '',
      clientId,
      projectId,
    }),
    queryFn: () =>
      countUnread({
        viewerId: user?.id ?? '',
        viewerRole: 'client',
        clientId,
        projectId,
      }),
    enabled: Boolean(projectId && project && user?.id),
  });

  useEffect(() => {
    if (!projectId || !user?.id) return;
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
    }, projectId);
  }, [projectId, user?.id, queryClient]);

  const handleApproveMilestone = async (milestone: MilestoneRecord) => {
    if (!user || !project) return;
    setActionError(null);
    setSubmittingActionId(milestone.id);
    const listKey = queryKeys.milestones.list(projectId);
    await queryClient.cancelQueries({queryKey: listKey});
    const previousMilestones = queryClient.getQueryData<MilestoneRecord[]>(listKey);
    queryClient.setQueryData<MilestoneRecord[]>(listKey, (old = []) =>
      old.map((m) =>
        m.id === milestone.id
          ? {
              ...m,
              status: 'Approved',
              actionByName: user.name || 'Client',
              actionAt: new Date().toISOString(),
            }
          : m,
      ),
    );

    try {
      await submitClientReview(milestone.id, 'Approved');
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(project.id)}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
      ]);
      await createNotification({
        recipientRole: 'admin',
        clientId: project.clientId,
        projectId: project.id,
        type: 'milestone',
        title: `Milestone approved: ${milestone.title}`,
        body: `${user.name} approved "${milestone.title}" on ${project.title}.`,
        link: `/admin/projects/${project.id}`,
        actorUid: user.id,
        actorName: user.name,
      });
    } catch (err) {
      if (previousMilestones) {
        queryClient.setQueryData(listKey, previousMilestones);
      }
      setActionError(getErrorMessage(err, 'Unable to approve milestone.'));
    } finally {
      setSubmittingActionId(null);
    }
  };

  const handleRequestChanges = async (milestone: MilestoneRecord, comment: string) => {
    if (!user || !project) {
      throw new Error('You must be signed in to request revisions.');
    }
    setActionError(null);
    setSubmittingActionId(milestone.id);
    try {
      await submitClientReview(milestone.id, 'Changes Requested', comment);
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(project.id)}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
      ]);
      await createNotification({
        recipientRole: 'admin',
        clientId: project.clientId,
        projectId: project.id,
        type: 'milestone',
        title: `Changes requested: ${milestone.title}`,
        body: `${user.name} requested changes on ${project.title}: "${comment}"`,
        link: `/admin/projects/${project.id}`,
        actorUid: user.id,
        actorName: user.name,
      });
    } finally {
      setSubmittingActionId(null);
    }
  };

  return {
    user,
    project,
    accessDenied,
    milestones,
    updates,
    unreadMessages,
    loadingProject,
    isRetryingProject: Boolean(projectError) && fetchingProject,
    refetchProject: () => void refetchProject(),
    loadingMilestones,
    milestonesError,
    isRetryingMilestones: Boolean(milestonesError) && fetchingMilestones,
    refetchMilestones: () => void refetchMilestones(),
    loadingUpdates,
    updatesError,
    isRetryingUpdates: Boolean(updatesError) && fetchingUpdates,
    refetchUpdates: () => void refetchUpdates(),
    projectError,
    actionError,
    setActionError,
    submittingActionId,
    handleApproveMilestone,
    handleRequestChanges,
  };
}
