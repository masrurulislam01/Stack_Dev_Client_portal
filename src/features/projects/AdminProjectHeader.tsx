import {ArrowLeft, Pencil} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge, Button} from '@/components/ui';
import {
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_DOT_CLASSES,
} from '@/config/constants';
import type {ProjectRecord} from '@/types/portal';
import {formatDateDisplay} from '@/utils/format';

interface AdminProjectHeaderProps {
  project: ProjectRecord;
  onEdit: () => void;
}

export function AdminProjectHeader({project, onEdit}: AdminProjectHeaderProps) {
  const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-surface rounded-2xl border border-border card-inset p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary-600 mb-2.5 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Projects</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-heading text-2xl sm:text-[28px] sm:leading-[34px] font-bold tracking-tight text-foreground">
            {project.title || 'Untitled Project'}
          </h1>
          <Badge
            dot
            dotClassName={PROJECT_STATUS_DOT_CLASSES[project.status]}
            className={PROJECT_STATUS_BADGE_CLASSES[project.status]}
          >
            {project.status}
          </Badge>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="font-medium text-body">{project.clientName || 'Client'}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{project.package || 'custom'} package</span>
          <span aria-hidden="true">·</span>
          <span className="num">Due {formatDateDisplay(project.dueDate)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 self-start sm:self-center">
        <div
          className="relative w-14 h-14 flex items-center justify-center shrink-0"
          aria-label={`Project completion ${progress}%`}
        >
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52" aria-hidden="true">
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              strokeWidth="5"
              className="stroke-surface-muted"
            />
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={
                project.status === 'Delivered'
                  ? 'stroke-success transition-all duration-300'
                  : 'stroke-primary-600 transition-all duration-300'
              }
            />
          </svg>
          <span className="absolute font-mono text-xs font-semibold text-foreground num">
            {progress}%
          </span>
        </div>

        <Button
          type="button"
          variant="secondary"
          icon={<Pencil className="w-4 h-4" aria-hidden="true" />}
          onClick={onEdit}
          className="whitespace-nowrap"
        >
          Edit Project
        </Button>
      </div>
    </div>
  );
}
