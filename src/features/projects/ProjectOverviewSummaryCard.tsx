import {Badge, Card} from '@/components/ui';
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_DOT_CLASSES,
} from '@/config/constants';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

interface ProjectOverviewSummaryCardProps {
  project: ProjectRecord;
  variant: 'admin' | 'client';
}

export function ProjectOverviewSummaryCard({project, variant}: ProjectOverviewSummaryCardProps) {
  const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
  const revisionsUsed = Number(project.revisionsUsed) || 0;
  const revisionsAllowed = Number(project.revisionsAllowed) || 0;
  const revisionsExceeded = revisionsUsed > revisionsAllowed;
  const revisionRatio =
    revisionsAllowed > 0 ? Math.min(100, Math.round((revisionsUsed / revisionsAllowed) * 100)) : revisionsUsed > 0 ? 100 : 0;
  const revisionNearLimit = !revisionsExceeded && revisionsAllowed > 0 && revisionRatio >= 75;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-foreground">Overall Progress</span>
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

      {variant === 'admin' ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-5 border-t border-border">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Client
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-foreground">
              {project.clientName || 'Client'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Package
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-foreground capitalize">
              {project.package || 'custom'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Status
            </dt>
            <dd className="mt-1.5">
              <Badge
                dot
                dotClassName={PROJECT_STATUS_DOT_CLASSES[project.status]}
                className={PROJECT_STATUS_BADGE_CLASSES[project.status]}
              >
                {project.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Start Date
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-foreground num">
              {formatDateDisplay(project.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Due Date
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-foreground num">
              {formatDateDisplay(project.dueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Revisions
            </dt>
            <dd className="mt-1.5 space-y-1.5">
              <div
                className={`text-sm font-semibold num ${
                  revisionsExceeded
                    ? 'text-danger-text'
                    : revisionNearLimit
                      ? 'text-warning-text'
                      : 'text-foreground'
                }`}
              >
                {revisionsUsed} used of {revisionsAllowed} allowed
              </div>
              <div className="h-1.5 w-full max-w-[180px] rounded-full bg-surface-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    revisionsExceeded
                      ? 'bg-danger'
                      : revisionNearLimit
                        ? 'bg-warning'
                        : 'bg-success'
                  }`}
                  style={{width: `${revisionRatio}%`}}
                />
              </div>
            </dd>
          </div>
        </dl>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-5 border-t border-border">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Status
            </dt>
            <dd className="mt-1.5">
              <Badge
                dot
                dotClassName={PROJECT_STATUS_DOT_CLASSES[project.status]}
                className={PROJECT_STATUS_BADGE_CLASSES[project.status]}
              >
                {project.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Package
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-foreground capitalize">
              {project.package || 'custom'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Start Date
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-foreground num">
              {formatDateDisplay(project.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Due Date
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-foreground num">
              {formatDateDisplay(project.dueDate)}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
