import {useQuery} from '@tanstack/react-query';
import {FolderOpen, Search} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {FilePreviewModal} from '@/features/files/FilePreviewModal';
import {GlobalFilesTable} from '@/features/files/GlobalFilesTable';
import {useAuth} from '@/hooks/useAuth';
import {useToast} from '@/hooks/useToast';
import {queryKeys} from '@/lib/queryKeys';
import {
  getSignedDownloadUrl,
  list as listFiles,
  SIGNED_URL_EXPIRY_SECONDS,
} from '@/services/files';
import {getErrorMessage} from '@/services/serviceUtils';
import type {ProjectFileRecord} from '@/types/portal';
import {triggerFileDownload} from '@/utils/fileSharing';

export function FilesPage() {
  const {user} = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState<ProjectFileRecord | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const clientFilterId = isAdmin ? undefined : user?.clientId || undefined;

  const {
    data: files = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.files.list({clientId: clientFilterId}),
    queryFn: () =>
      listFiles({
        clientId: clientFilterId,
        viewerId: user?.id,
        viewerName: user?.name,
        viewerRole: user?.role,
      }),
    enabled: Boolean(user && (isAdmin || user.clientId)),
  });

  useEffect(() => {
    if (error) {
      const message = getErrorMessage(error, 'Unable to load shared files.');
      console.error('[FilesPage] File list load failed:', error);
      toast.error('Could not load files', message);
    }
  }, [error, toast]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return files;
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.projectTitle.toLowerCase().includes(term) ||
        f.uploadedByName.toLowerCase().includes(term),
    );
  }, [files, search]);

  const handleDownload = async (file: ProjectFileRecord) => {
    setDownloadError(null);
    setDownloadingId(file.id);
    try {
      const freshUrl = await getSignedDownloadUrl(file.storagePath, SIGNED_URL_EXPIRY_SECONDS);
      await triggerFileDownload(freshUrl, file.name);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to download file.');
      console.error('[FilesPage] Download failed:', file.id, file.storagePath, err);
      setDownloadError(message);
      toast.error('Download failed', message);
    } finally {
      setDownloadingId(null);
    }
  };

  const displayedError =
    downloadError || (error ? getErrorMessage(error, 'Unable to load shared files.') : null);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Files
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Shared assets, builds, and documents across your projects. Open any project&apos;s
            Files tab to upload new files.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files or projects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
      </div>

      {displayedError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {displayedError}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen
              className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {files.length === 0 ? 'No shared files yet' : 'No matching files'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {files.length === 0
                ? 'Upload files from any project’s Files tab to share deliverables and assets.'
                : 'Try adjusting your search query.'}
            </p>
          </div>
        ) : (
          <GlobalFilesTable
            files={filtered}
            isAdmin={isAdmin}
            downloadingId={downloadingId}
            onPreview={setPreviewFile}
            onDownload={(file) => void handleDownload(file)}
          />
        )}
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </section>
  );
}
