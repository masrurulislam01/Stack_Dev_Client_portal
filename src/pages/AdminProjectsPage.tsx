import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowRight, FolderKanban, Pencil, Plus, Trash2} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ProjectFormModal} from '../components/ProjectFormModal';
import {useAuth} from '../context/AuthContext';
import {queryKeys} from '../lib/queryKeys';
import {list as listClients} from '../services/clients';
import {
  create as createProject,
  list as listProjects,
  remove as removeProject,
  update as updateProject,
} from '../services/projects';
import {getErrorMessage} from '../services/serviceUtils';
import {create as createUpdate} from '../services/updates';
import {
  PROJECT_STATUSES,
  type ProjectFormParsed,
  type ProjectRecord,
  type ProjectStatus,
} from '../types/portal';
import {createNotification} from '../utils/notifications';

const STATUS_TEXT_COLORS: Record<ProjectStatus, string> = {
  Planning: 'text-amber-700 dark:text-amber-400',
  Design: 'text-amber-700 dark:text-amber-400',
  Development: 'text-indigo-700 dark:text-indigo-400',
  Review: 'text-indigo-700 dark:text-indigo-400',
  Delivered: 'text-emerald-700 dark:text-emerald-400',
};

export function AdminProjectsPage() {
  const {user} = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
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

  const isDeleting = deleteMutation.isPending;

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (clientFilter !== 'ALL' && p.clientId !== clientFilter) return false;
      return true;
    });
  }, [projects, statusFilter, clientFilter]);

  useEffect(() => {
    if (!deletingProject) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        setDeletingProject(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deletingProject, isDeleting]);

  const handleSaveProject = async (values: ProjectFormParsed) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    const actorName = user.name || 'Stack Dev';
    const actorUid = user.id;

    if (editingProject) {
      const updateMessage = `Updated to ${values.status} stage (${values.progress}% complete).`;
      try {
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
      } catch (err) {
        const message = getErrorMessage(err, 'Unable to update project.');
        setActionError(message);
        throw err;
      }
      return;
    }

    try {
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
      const message = getErrorMessage(err, 'Unable to create project.');
      setActionError(message);
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

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Projects
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage website and Flutter mobile app engagements across all clients.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Project</span>
        </button>
      </div>

      {displayedError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4"
        >
          <span>{displayedError}</span>
          {actionError && (
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-xs font-medium underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-status"
              className="text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Status
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="ALL">All statuses</option>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-client"
              className="text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Client
            </label>
            <select
              id="filter-client"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="ALL">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <FolderKanban className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {statusFilter !== 'ALL' || clientFilter !== 'ALL'
              ? 'Try clearing your status or client filter.'
              : 'Create your first project to start tracking milestones and deliverables.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate"
                    >
                      {project.title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="truncate">{project.clientName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{project.package}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-medium ${STATUS_TEXT_COLORS[project.status]}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(project);
                        setIsModalOpen(true);
                      }}
                      aria-label={`Edit ${project.title}`}
                      className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProject(project)}
                      aria-label={`Delete ${project.title}`}
                      className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        project.status === 'Delivered'
                          ? 'bg-emerald-600 dark:bg-emerald-500'
                          : 'bg-indigo-600 dark:bg-indigo-500'
                      }`}
                      style={{width: `${project.progress}%`}}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="tabular-nums">
                  <span>Due {project.dueDate}</span>
                  <span aria-hidden="true"> · </span>
                  <span
                    className={
                      project.revisionsUsed > project.revisionsAllowed
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : ''
                    }
                  >
                    Revisions {project.revisionsUsed}/{project.revisionsAllowed}
                  </span>
                </div>
                <Link
                  to={`/admin/projects/${project.id}`}
                  className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        clients={clients}
        initialProject={editingProject}
      />

      {deletingProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-proj-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <h3
              id="delete-proj-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Delete Project
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {deletingProject.title}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
