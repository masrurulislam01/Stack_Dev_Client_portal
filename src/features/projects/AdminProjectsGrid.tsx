import {ArrowRight, Calendar, FolderKanban, Pencil, Plus, Trash2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge, Button, Card, EmptyState} from '@/components/ui';
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_DOT_CLASSES,
} from '@/config/constants';
import type {ProjectRecord} from '@/types/portal';
import {getAvatarToneClass, getInitials} from '@/utils/avatar';
import {formatDateDisplay} from '@/utils/format';

interface AdminProjectsGridProps {
  projects: ProjectRecord[];
  loading: boolean;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
  onEdit: (project: ProjectRecord) => void;
  onDelete: (project: ProjectRecord) => void;
}

function isProjectOverdue(project: ProjectRecord): boolean {
  if (!project.dueDate || project.status === 'Delivered') return false;
  const due = new Date(project.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function AdminProjectsGrid({
  projects,
  loading,
  hasActiveFilters,
  onClearFilters,
  onCreate,
  onEdit,
  onDelete,
}: AdminProjectsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 rounded-lg skeleton-shimmer" />
                <div className="h-3.5 w-36 rounded-lg skeleton-shimmer" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
                <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between">
                <div className="h-3 w-16 rounded skeleton-shimmer" />
                <div className="h-3 w-8 rounded skeleton-shimmer" />
              </div>
              <div className="h-2 w-full rounded-full skeleton-shimmer" />
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="h-3.5 w-40 rounded skeleton-shimmer" />
              <div className="h-3.5 w-14 rounded skeleton-shimmer" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="w-5 h-5" aria-hidden="true" />}
        title="No projects found"
        description={
          hasActiveFilters
            ? 'Try clearing your status or client filter.'
            : 'Create your first project to start tracking milestones and deliverables.'
        }
        action={
          hasActiveFilters && onClearFilters ? (
            <Button type="button" variant="secondary" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : (
            !hasActiveFilters &&
            onCreate && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" aria-hidden="true" />}
                onClick={onCreate}
              >
                New Project
              </Button>
            )
          )
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {projects.map((project) => {
        const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
        const revisionsUsed = Number(project.revisionsUsed) || 0;
        const revisionsAllowed = Number(project.revisionsAllowed) || 0;
        const overdue = isProjectOverdue(project);
        const clientLabel = project.clientName || 'Client';

        return (
          <Card key={project.id} interactive className="p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${getAvatarToneClass(
                      clientLabel,
                    )}`}
                    aria-hidden="true"
                  >
                    {getInitials(clientLabel)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className="font-heading text-base font-semibold text-foreground hover:text-primary-600 transition-colors block truncate focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded"
                    >
                      {project.title || 'Untitled Project'}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="truncate font-medium text-body">{clientLabel}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-muted border border-border text-[11px] font-medium text-muted capitalize">
                        {project.package || 'custom'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(project)}
                    aria-label={`Edit ${project.title || 'project'}`}
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-primary-600 hover:bg-surface-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(project)}
                    aria-label={`Delete ${project.title || 'project'}`}
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-muted hover:text-danger-text hover:bg-danger-soft transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Badge
                  dot
                  dotClassName={PROJECT_STATUS_DOT_CLASSES[project.status]}
                  className={PROJECT_STATUS_BADGE_CLASSES[project.status]}
                >
                  {project.status}
                </Badge>
                <span
                  className={`text-xs num ${
                    revisionsUsed > revisionsAllowed
                      ? 'text-danger-text font-semibold'
                      : 'text-muted'
                  }`}
                >
                  Revisions {revisionsUsed}/{revisionsAllowed}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted font-medium">Progress</span>
                  <span className="font-semibold text-foreground num">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      project.status === 'Delivered' ? 'bg-success' : 'bg-gradient-brand'
                    }`}
                    style={{width: `${progress}%`}}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <div
                className={`inline-flex items-center gap-1.5 num ${
                  overdue ? 'text-danger-text font-semibold' : 'text-muted'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Due {formatDateDisplay(project.dueDate)}</span>
              </div>
              <Link
                to={`/admin/projects/${project.id}`}
                className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded"
              >
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
