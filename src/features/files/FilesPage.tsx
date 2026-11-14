import {useQuery} from '@tanstack/react-query';
import {FolderOpen, Search} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  Button,
  EmptyState,
  ErrorAlert,
  Input,
  TableContainer,
  TableHead,
  TableHeaderCell,
} from '@/components/ui';
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
    isFetching,
    error,
    refetch,
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
        (f.name ?? '').toLowerCase().includes(term) ||
        (f.projectTitle ?? '').toLowerCase().includes(term) ||
        (f.uploadedByName ?? '').toLowerCase().includes(term) ||
        (f.extension ?? '').toLowerCase().includes(term),
    );
  }, [files, search]);

  const handleDownload = async (file: ProjectFileRecord) => {
    setDownloadError(null);
    setDownloadingId(file.id);
    try {
      const freshUrl = await getSignedDownloadUrl(file.storagePath, SIGNED_URL_EXPIRY_SECONDS);
      await triggerFileDownload(freshUrl, file.name || 'file');
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
    <section className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground">
            Files
          </h1>
          <p className="text-sm text-muted mt-1">
            Shared assets, builds, and documents across your projects. Open any project&apos;s
            Files tab to upload new files.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files or projects..."
            aria-label="Search files or projects"
            className="pl-10"
          />
        </div>
      </div>

      {displayedError && (
        <ErrorAlert
          message={displayedError}
          onRetry={error ? () => void refetch() : undefined}
          retrying={isFetching}
          onDismiss={downloadError ? () => setDownloadError(null) : undefined}
        />
      )}

      {loading ? (
        <TableContainer>
          <TableHead>
            <TableHeaderCell className="px-6">File</TableHeaderCell>
            <TableHeaderCell>Project</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Size</TableHeaderCell>
            <TableHeaderCell>Uploader</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell align="right" className="px-6">
              Actions
            </TableHeaderCell>
          </TableHead>
          <tbody className="divide-y divide-border">
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="h-[56px]">
                <td className="py-3.5 px-6">
                  <div className="h-4 w-44 rounded skeleton-shimmer" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-32 rounded skeleton-shimmer" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-24 rounded skeleton-shimmer" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-16 rounded skeleton-shimmer" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-28 rounded skeleton-shimmer" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-3.5 w-28 rounded skeleton-shimmer" />
                </td>
                <td className="py-3.5 px-6 text-right">
                  <div className="inline-flex items-center gap-1">
                    <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                    <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-5 h-5" aria-hidden="true" />}
          title={files.length === 0 ? 'No shared files yet' : 'No matching files'}
          description={
            files.length === 0
              ? 'Upload files from any project’s Files tab to share deliverables and assets.'
              : 'Try adjusting your search query.'
          }
          action={
            files.length === 0 ? (
              <Link
                to={isAdmin ? '/admin/projects' : '/projects'}
                className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-semibold hover:brightness-110 transition-all"
              >
                Open Projects
              </Link>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <GlobalFilesTable
          files={filtered}
          isAdmin={isAdmin}
          downloadingId={downloadingId}
          onPreview={setPreviewFile}
          onDownload={(file) => void handleDownload(file)}
        />
      )}

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </section>
  );
}
