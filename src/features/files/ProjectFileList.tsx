import {FolderOpen} from 'lucide-react';
import {EmptyState} from '@/components/ui';
import {ProjectFileMobileList} from '@/features/files/ProjectFileMobileList';
import {ProjectFileTable} from '@/features/files/ProjectFileTable';
import type {ProjectFileRecord} from '@/types/portal';

interface ProjectFileListProps {
  projectTitle: string;
  files: ProjectFileRecord[];
  loading: boolean;
  canDelete: (file: ProjectFileRecord) => boolean;
  confirmDeleteId: string | null;
  deletingId: string | null;
  downloadingId: string | null;
  onPreview: (file: ProjectFileRecord) => void;
  onDownload: (file: ProjectFileRecord) => void;
  onRequestDelete: (fileId: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (file: ProjectFileRecord) => void;
}

export function ProjectFileList(props: ProjectFileListProps) {
  const {projectTitle, files, loading} = props;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Shared Files
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Private deliverables, builds, designs, and assets for {projectTitle}.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {loading ? (
        <div className="p-6 space-y-3 animate-pulse">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          className="border-0 shadow-none rounded-none p-10"
          icon={<FolderOpen className="w-5 h-5" aria-hidden="true" />}
          title="No files uploaded yet"
          description="Drag and drop PDFs, documents, spreadsheets, archives, or images above to share them with the project team."
        />
      ) : (
        <>
          <ProjectFileTable {...props} />
          <ProjectFileMobileList
            files={props.files}
            canDelete={props.canDelete}
            confirmDeleteId={props.confirmDeleteId}
            deletingId={props.deletingId}
            downloadingId={props.downloadingId}
            onPreview={props.onPreview}
            onDownload={props.onDownload}
            onRequestDelete={props.onRequestDelete}
            onCancelDelete={props.onCancelDelete}
            onConfirmDelete={props.onConfirmDelete}
          />
        </>
      )}
    </div>
  );
}
