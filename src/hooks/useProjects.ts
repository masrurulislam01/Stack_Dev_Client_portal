import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as createProject,
  getById as getProjectById,
  list as listProjects,
  remove as removeProject,
  update as updateProject,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@/services/projects';

export function useProjects(clientId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.list(clientId),
    queryFn: () => listProjects(clientId ? {clientId} : {}),
    enabled,
  });
}

export function useProjectDetail(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProjectById(projectId),
    enabled: Boolean(projectId) && enabled,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix});
    },
  });
}

export function useUpdateProject(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, input}: {id: string; input: UpdateProjectInput}) =>
      updateProject(id, input),
    onSuccess: (_data, variables) => {
      const targetId = projectId ?? variables.id;
      void queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(targetId)});
      void queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix});
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeProject(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix});
      void queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(id)});
    },
  });
}
