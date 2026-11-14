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
    error: projectError,
  } = useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: () => getProjectById(projectId ?? ''),
    enabled: Boolean(projectId && clientId),
  });

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
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to submit revision request.'));
      throw err;
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
    loadingMilestones,
    loadingUpdates,
    projectError,
    actionError,
    setActionError,
    submittingActionId,
    handleApproveMilestone,
    handleRequestChanges,
  };
}
