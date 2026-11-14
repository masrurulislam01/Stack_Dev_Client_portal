import {Plus} from 'lucide-react';
import {Button, ConfirmDialog, ErrorAlert, Select} from '@/components/ui';
import {PROJECT_STATUSES} from '@/config/constants';
import {AdminProjectsGrid} from '@/features/projects/AdminProjectsGrid';
import {ProjectFormModal} from '@/features/projects/ProjectFormModal';
import {useAdminProjects} from '@/features/projects/useAdminProjects';

export function AdminProjectsPage() {
  const vm = useAdminProjects();

  return (
    <section className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage website and Flutter mobile app engagements across all clients.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          icon={<Plus className="w-4 h-4" aria-hidden="true" />}
          onClick={() => {
            vm.setEditingProject(null);
            vm.setIsModalOpen(true);
          }}
          className="whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          New Project
        </Button>
      </div>

      {vm.displayedError && (
        <ErrorAlert
          message={vm.displayedError}
          onRetry={vm.hasLoadError && !vm.actionError ? vm.refetchProjects : undefined}
          retrying={vm.isRetrying}
          onDismiss={vm.actionError ? () => vm.setActionError(null) : undefined}
        />
      )}

      <div className="bg-surface rounded-2xl border border-border card-inset p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {(['ALL', ...PROJECT_STATUSES] as const).map((status) => {
            const active = vm.statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => vm.setStatusFilter(status)}
                aria-pressed={active}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                  active
                    ? 'bg-primary-50 text-primary-600 border-primary-200'
                    : 'bg-surface text-muted border-border hover:border-border-strong hover:text-foreground'
                }`}
              >
                {status === 'ALL' ? 'All statuses' : status}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-client" className="text-xs font-semibold text-muted whitespace-nowrap">
              Client
            </label>
            <Select
              id="filter-client"
              value={vm.clientFilter}
              onChange={(e) => vm.setClientFilter(e.target.value)}
              className="min-h-[38px] py-1.5 min-w-[168px]"
            >
              <option value="ALL">All clients</option>
              {vm.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </Select>
          </div>

          <span className="text-xs font-medium text-muted num whitespace-nowrap">
            {vm.filteredProjects.length}{' '}
            {vm.filteredProjects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
      </div>

      <AdminProjectsGrid
        projects={vm.filteredProjects}
        loading={vm.loading}
        hasActiveFilters={vm.statusFilter !== 'ALL' || vm.clientFilter !== 'ALL'}
        onClearFilters={() => {
          vm.setStatusFilter('ALL');
          vm.setClientFilter('ALL');
        }}
        onCreate={() => {
          vm.setEditingProject(null);
          vm.setIsModalOpen(true);
        }}
        onEdit={(project) => {
          vm.setEditingProject(project);
          vm.setIsModalOpen(true);
        }}
        onDelete={(project) => {
          vm.setDeleteError(null);
          vm.setDeletingProject(project);
        }}
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
            <span className="font-semibold text-foreground">
              {vm.deletingProject?.title || 'this project'}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        confirmBusyLabel="Deleting..."
        loading={vm.isDeleting}
        error={vm.deleteError}
        onClose={() => {
          vm.setDeleteError(null);
          vm.setDeletingProject(null);
        }}
        onConfirm={() => void vm.handleDeleteProject()}
      />
    </section>
  );
}
