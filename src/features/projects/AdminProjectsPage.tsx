import {useQueryClient} from '@tanstack/react-query';
import {FolderKanban, Plus} from 'lucide-react';
import {useMemo, useState} from 'react';
import {Button, ConfirmDialog, EmptyState} from '@/components/ui';
import {ProjectCard} from '@/features/projects/ProjectCard';
import {ProjectFormModal} from '@/features/projects/ProjectFormModal';
import {useAuth, useClients, useDeleteProject, useProjects} from '@/hooks';
import {PROJECT_STATUSES} from '@/lib/constants';
import {queryKeys} from '@/lib/queryKeys';
import {create as createProject, update as updateProject} from '@/services/projects';
import {getErrorMessage} from '@/services/serviceUtils';
import {create as createUpdate} from '@/services/updates';
import type {ProjectFormParsed, ProjectRecord} from '@/types/portal';
import {createNotification} from '@/utils/notifications';

export function AdminProjectsPage() {
  const {user} = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectRecord | null>(null);

  const {data: projects = [], isLoading: loading, error: projectsError} = useProjects();
  const {data: clients = []} = useClients();
  const deleteMutation = useDeleteProject();

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
      const target = editingProject
        ? await updateProject(editingProject.id, values)
        : await createProject(values);
      const message = editingProject
        ? `Updated to ${values.status} stage (${values.progress}% complete).`
        : `Project started in ${values.status} stage.`;
      await createUpdate({projectId: target.id, authorId: actorUid, message, attachments: []});
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix}),
      ]);
      await createNotification({
        recipientRole: 'client',
        clientId: values.clientId,
        projectId: target.id,
        type: 'update',
        title: editingProject ? `Project update: ${values.title}` : `New project started: ${values.title}`,
        body: message,
        link: `/projects/${target.id}?tab=timeline`,
        actorUid,
        actorName,
      });
    } catch (err) {
      setActionError(getErrorMessage(err, editingProject ? 'Unable to update project.' : 'Unable to create project.'));
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
    actionError || (projectsError ? getErrorMessage(projectsError, 'Unable to load projects.') : null);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Projects</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage website and Flutter mobile app engagements across all clients.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
          className="whitespace-nowrap shrink-0"
        >
          New Project
        </Button>
      </div>

      {displayedError && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{displayedError}</span>
          {actionError && (
            <button type="button" onClick={() => setActionError(null)} className="text-xs font-medium underline shrink-0">Dismiss</button>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-status" className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
            <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600">
              <option value="ALL">All statuses</option>
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-client" className="text-xs font-medium text-slate-500 dark:text-slate-400">Client</label>
            <select id="filter-client" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600">
              <option value="ALL">All clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-5 h-5" aria-hidden="true" />}
          title="No projects found"
          description={statusFilter !== 'ALL' || clientFilter !== 'ALL' ? 'Try clearing your status or client filter.' : 'Create your first project to start tracking milestones and deliverables.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              mode="admin"
              onEdit={(target) => {
                setEditingProject(target);
                setIsModalOpen(true);
              }}
              onDelete={setDeletingProject}
            />
          ))}
        </div>
      )}

      <ProjectFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProject} clients={clients} initialProject={editingProject} />

      <ConfirmDialog
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={() => void handleDeleteProject()}
        title="Delete Project"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{deletingProject?.title}</span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        loading={deleteMutation.isPending}
      />
    </section>
  );
}
