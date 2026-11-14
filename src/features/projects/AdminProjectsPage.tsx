import {Plus} from 'lucide-react';
import {ConfirmDialog} from '@/components/ui';
import {PROJECT_STATUSES} from '@/config/constants';
import {AdminProjectsGrid} from '@/features/projects/AdminProjectsGrid';
import {ProjectFormModal} from '@/features/projects/ProjectFormModal';
import {useAdminProjects} from '@/features/projects/useAdminProjects';

export function AdminProjectsPage() {
  const vm = useAdminProjects();

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
            vm.setEditingProject(null);
            vm.setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Project</span>
        </button>
      </div>

      {vm.displayedError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4"
        >
          <span>{vm.displayedError}</span>
          {vm.actionError && (
            <button
              type="button"
              onClick={() => vm.setActionError(null)}
              className="text-xs font-medium underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

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
              value={vm.statusFilter}
              onChange={(e) => vm.setStatusFilter(e.target.value)}
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
              value={vm.clientFilter}
              onChange={(e) => vm.setClientFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
            >
              <option value="ALL">All clients</option>
              {vm.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {vm.filteredProjects.length}{' '}
          {vm.filteredProjects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      <AdminProjectsGrid
        projects={vm.filteredProjects}
        loading={vm.loading}
        hasActiveFilters={vm.statusFilter !== 'ALL' || vm.clientFilter !== 'ALL'}
        onEdit={(project) => {
          vm.setEditingProject(project);
          vm.setIsModalOpen(true);
        }}
        onDelete={vm.setDeletingProject}
      />

      <ProjectFormModal
        isOpen={vm.isModalOpen}
        onClose={() => vm.setIsModalOpen(false)}
        onSave={vm.handleSaveProject}
        clients={vm.clients}
        initialProject={vm.editingProject}
      />

      <ConfirmDialog
        open={Boolean(vm.deletingProject)}
        title="Delete Project"
        titleId="delete-proj-title"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {vm.deletingProject?.title}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmBusyLabel="Deleting..."
        loading={vm.isDeleting}
        onClose={() => vm.setDeletingProject(null)}
        onConfirm={() => void vm.handleDeleteProject()}
      />
    </section>
  );
}
