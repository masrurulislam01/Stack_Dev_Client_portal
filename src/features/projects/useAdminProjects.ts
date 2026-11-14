import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useMemo, useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {queryKeys} from '@/lib/queryKeys';
import {list as listClients} from '@/services/clients';
import {
  create as createProject,
  list as listProjects,
  remove as removeProject,
  update as updateProject,
} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import {create as createUpdate} from '@/services/updates';
import type {ProjectFormParsed, ProjectRecord} from '@/types/portal';
import {createNotification} from '@/utils/notifications';

export function useAdminProjects() {
  const {user} = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectRecord | null>(null);

  const {
    data: projects = [],
    isLoading: loading,
    error: projectsError,
  } = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => listProjects(),
  });

  const {data: clients = []} = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => listClients(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix});
    },
  });

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) => {
        if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
        if (clientFilter !== 'ALL' && p.clientId !== clientFilter) return false;
        return true;
      }),
    [projects, statusFilter, clientFilter],
  );

  const handleSaveProject = async (values: ProjectFormParsed) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    const actorName = user.name || 'Stack Dev';
    const actorUid = user.id;

    try {
      if (editingProject) {
        const updateMessage = `Updated to ${values.status} stage (${values.progress}% complete).`;
        await updateProject(editingProject.id, values);
        await createUpdate({
          projectId: editingProject.id,
          authorId: actorUid,
          message: updateMessage,
          attachments: [],
        });
        await Promise.all([
          queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
          queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix}),
        ]);
        await createNotification({
          recipientRole: 'client',
          clientId: values.clientId,
          projectId: editingProject.id,
          type: 'update',
          title: `Project update: ${values.title}`,
          body: updateMessage,
          link: `/projects/${editingProject.id}?tab=timeline`,
          actorUid,
          actorName,
        });
        return;
      }

      const created = await createProject(values);
      const startMessage = `Project started in ${values.status} stage.`;
      await createUpdate({
        projectId: created.id,
        authorId: actorUid,
        message: startMessage,
        attachments: [],
      });
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix}),
      ]);
      await createNotification({
        recipientRole: 'client',
        clientId: values.clientId,
        projectId: created.id,
        type: 'update',
        title: `New project started: ${values.title}`,
        body: startMessage,
        link: `/projects/${created.id}?tab=timeline`,
        actorUid,
        actorName,
      });
    } catch (err) {
      const fallback = editingProject ? 'Unable to update project.' : 'Unable to create project.';
      setActionError(getErrorMessage(err, fallback));
      throw err;
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject || !user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(deletingProject.id);
      setDeletingProject(null);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to delete project.'));
    }
  };

  const displayedError =
    actionError ||
    (projectsError ? getErrorMessage(projectsError, 'Unable to load projects.') : null);

  return {
    clients,
    filteredProjects,
    loading,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    actionError,
    setActionError,
    displayedError,
    isModalOpen,
    setIsModalOpen,
    editingProject,
    setEditingProject,
    deletingProject,
    setDeletingProject,
    isDeleting: deleteMutation.isPending,
    handleSaveProject,
    handleDeleteProject,
  };
}
