import {SIGNED_URL_EXPIRY_SECONDS, STORAGE_BUCKET} from '@/config/constants';
import {env, isDemoMode} from '@/lib/env';
import {putMockStorageFile} from '@/lib/mockSupabase';
import {supabase} from '@/lib/supabase';
import {assertSafeRecordId, getErrorMessage, parseServiceInput} from '@/services/serviceUtils';
import type {FileRow} from '@/types/database';
import type {ProjectFileRecord} from '@/types/portal';
import {fileUploadMetadataSchema, updateFileInputSchema} from '@/types/schemas';
import {getFileExtension, sanitizeStorageFileName} from '@/utils/fileSharing';

export {SIGNED_URL_EXPIRY_SECONDS, STORAGE_BUCKET};

export class UploadCancelledError extends Error {
  constructor(message = 'Upload was cancelled.') {
    super(message);
    this.name = 'UploadCancelledError';
  }
}

interface FileJoinedRow extends FileRow {
  projects?: {title?: string | null; client_id?: string | null} | null;
  profiles?: {full_name?: string | null; role?: string | null} | null;
}

export interface ListFilesOptions {
  projectId?: string;
  clientId?: string;
  viewerId?: string;
  viewerName?: string;
  viewerRole?: 'admin' | 'client';
}

export interface CreateFileInput {
  projectId: string;
  clientId: string;
  uploadedByUid: string;
  uploadedByName?: string;
  uploadedByRole?: 'admin' | 'client';
  file: File;
  mimeType: string;
  signal?: AbortSignal;
  onProgress?: (percent: number, loadedBytes?: number, totalBytes?: number) => void;
}

export interface UpdateFileInput {
  name?: string;
}

function encodeStorageObjectPath(storagePath: string): string {
  return storagePath
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function parseStorageHttpError(status: number, responseText: string): string {
  let rawMessage = '';
  try {
    const parsed = JSON.parse(responseText) as {
      message?: string;
      error?: string;
      statusCode?: string | number;
    };
    rawMessage = parsed.message || parsed.error || '';
  } catch {
    rawMessage = responseText;
  }

  const lower = rawMessage.toLowerCase();

  if (status === 401 || lower.includes('jwt') || lower.includes('unauthorized')) {
    return 'Your session has expired. Please sign in again to upload files.';
  }
  if (status === 403 || lower.includes('row-level security') || lower.includes('policy')) {
    return 'You do not have permission to upload files to this project.';
  }
  if (status === 404 && lower.includes('bucket')) {
    return 'Supabase Storage bucket "project-files" was not found.';
  }
  if (status === 413 || lower.includes('maximum allowed size') || lower.includes('payload too large')) {
    return 'File exceeds the 25 MB bucket upload limit.';
  }
  if (status === 415 || lower.includes('mime type')) {
    return rawMessage || 'This file MIME type is not allowed by the storage bucket.';
  }
  if (status === 409 || lower.includes('already exists')) {
    return 'A file with this unique path already exists. Please retry.';
  }

  return rawMessage || `Storage upload failed (HTTP ${status}).`;
}

async function uploadBlobWithProgress(params: {
  storagePath: string;
  file: File;
  safeName: string;
  mimeType: string;
  accessToken: string;
  signal?: AbortSignal;
  onProgress?: (percent: number, loadedBytes?: number, totalBytes?: number) => void;
}): Promise<void> {
  const {storagePath, file, safeName, mimeType, accessToken, signal, onProgress} = params;

  if (signal?.aborted) {
    throw new UploadCancelledError();
  }

  if (isDemoMode) {
    onProgress?.(45, Math.round(file.size / 2), file.size);
    await putMockStorageFile(storagePath, file);
    if (signal?.aborted) {
      throw new UploadCancelledError();
    }
    onProgress?.(95, file.size, file.size);
    return;
  }

  const encodedPath = encodeStorageObjectPath(storagePath);
  const uploadUrl = `${env.supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${encodedPath}`;

  const normalizedFile = new File([file], safeName, {type: mimeType});
  const formData = new FormData();
  formData.append('cacheControl', '3600');
  formData.append('', normalizedFile, safeName);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort);
    };

    const handleAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      xhr.abort();
      reject(new UploadCancelledError());
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, {once: true});
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(95, Math.max(1, Math.round((event.loaded / event.total) * 95)));
        onProgress?.(pct, event.loaded, event.total);
      }
    };

    xhr.onabort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new UploadCancelledError());
    };

    xhr.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Network error during file upload. Check your connection and retry.'));
    };

    xhr.ontimeout = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('File upload timed out. Please try again.'));
    };

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      cleanup();

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(95, file.size, file.size);
        resolve();
        return;
      }

      reject(new Error(parseStorageHttpError(xhr.status, xhr.responseText || '')));
    };

    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('apikey', env.supabaseAnonKey);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.send(formData);
  });
}

function isSafeStoragePath(storagePath: string): boolean {
  const trimmed = storagePath.trim();
  return (
    trimmed.length > 0 &&
    !trimmed.startsWith('/') &&
    !trimmed.includes('..') &&
    !trimmed.includes('\\') &&
    !/[\x00-\x1f\x7f]/.test(trimmed)
  );
}

export async function createSignedUrlMap(
  paths: string[],
  expiresInSeconds = SIGNED_URL_EXPIRY_SECONDS,
): Promise<Map<string, string>> {
  const uniquePaths = Array.from(
    new Set(paths.map((p) => p.trim()).filter((p) => isSafeStoragePath(p))),
  );
  const urlMap = new Map<string, string>();
  if (uniquePaths.length === 0) return urlMap;

  const {data, error} = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(uniquePaths, expiresInSeconds);

  if (error) {
    console.error('[files.ts] Failed to create signed URLs:', error);
    return urlMap;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.path && item.signedUrl && !item.error) {
        urlMap.set(item.path, item.signedUrl);
      }
    }
  }

  return urlMap;
}

export async function getSignedDownloadUrl(
  storagePath: string,
  expiresInSeconds = SIGNED_URL_EXPIRY_SECONDS,
): Promise<string> {
  if (!isSafeStoragePath(storagePath)) {
    throw new Error('File storage path is missing or invalid.');
  }

  const {data, error} = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(getErrorMessage(error, 'Unable to generate temporary file link.'));
  }

  return data.signedUrl;
}

function mapFileRow(
  row: FileJoinedRow,
  signedUrl: string,
  viewer?: {viewerId?: string; viewerName?: string; viewerRole?: 'admin' | 'client'},
): ProjectFileRecord {
  const uploadedByUid = String(row.uploaded_by ?? '');
  const isViewer = Boolean(viewer?.viewerId && uploadedByUid === viewer.viewerId);

  const profileRole =
    row.profiles?.role === 'admin'
      ? ('admin' as const)
      : row.profiles?.role === 'client'
        ? ('client' as const)
        : isViewer && viewer?.viewerRole
          ? viewer.viewerRole
          : viewer?.viewerRole === 'client'
            ? ('admin' as const)
            : ('client' as const);

  const uploadedByName =
    row.profiles?.full_name ||
    (isViewer && viewer?.viewerName ? viewer.viewerName : '') ||
    (profileRole === 'admin' ? 'Stack Dev' : 'Client');

  const name = String(row.name ?? 'Untitled file');

  return {
    id: String(row.id),
    clientId: String(row.projects?.client_id ?? ''),
    projectId: String(row.project_id ?? ''),
    projectTitle: String(row.projects?.title ?? ''),
    name,
    size: Number(row.size_bytes ?? 0),
    mimeType: String(row.mime_type ?? ''),
    extension: getFileExtension(name),
    storagePath: String(row.storage_path ?? ''),
    downloadUrl: signedUrl,
    uploadedByUid,
    uploadedByName,
    uploadedByRole: profileRole,
    createdAt: row.created_at,
  };
}

const FILE_SELECT =
  'id, project_id, uploaded_by, name, storage_path, size_bytes, mime_type, created_at, projects!inner(title, client_id), profiles(full_name, role)';

export async function list(options: ListFilesOptions = {}): Promise<ProjectFileRecord[]> {
  let query = supabase
    .from('files')
    .select(FILE_SELECT)
    .order('created_at', {ascending: false});

  if (options.projectId) {
    query = query.eq('project_id', options.projectId);
  }
  if (options.clientId) {
    query = query.eq('projects.client_id', options.clientId);
  }

  const {data, error} = await query;
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load shared files.'));
  }

  const rows = (data ?? []) as unknown as FileJoinedRow[];
  const signedUrls = await createSignedUrlMap(rows.map((r) => String(r.storage_path ?? '')));

  return rows.map((row) =>
    mapFileRow(row, signedUrls.get(String(row.storage_path ?? '')) ?? '', options),
  );
}

export async function getById(id: string): Promise<ProjectFileRecord | null> {
  const safeId = assertSafeRecordId(id, 'file');
  const {data, error} = await supabase
    .from('files')
    .select(FILE_SELECT)
    .eq('id', safeId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load file details.'));
  }
  if (!data) return null;

  const row = data as unknown as FileJoinedRow;
  const signedMap = await createSignedUrlMap([String(row.storage_path ?? '')]);
  return mapFileRow(row, signedMap.get(String(row.storage_path ?? '')) ?? '');
}

async function removeStorageObjectQuietly(storagePath: string): Promise<void> {
  await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
}

export async function create(input: CreateFileInput): Promise<ProjectFileRecord> {
  const valid = parseServiceInput(fileUploadMetadataSchema, {
    projectId: input.projectId,
    clientId: input.clientId,
    uploadedByUid: input.uploadedByUid,
    uploadedByName: input.uploadedByName,
    uploadedByRole: input.uploadedByRole,
    fileName: input.file.name,
    fileSize: input.file.size,
    mimeType: input.mimeType,
  });

  const {
    data: {session},
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again to upload files.');
  }

  const authenticatedUid = session.user?.id || valid.uploadedByUid;
  const fileUuid = crypto.randomUUID();
  const safeName = sanitizeStorageFileName(valid.fileName);
  const safeClientSegment = assertSafeRecordId(valid.clientId, 'client');
  const safeProjectSegment = assertSafeRecordId(valid.projectId, 'project');
  const storagePath = `${safeClientSegment}/${safeProjectSegment}/${fileUuid}-${safeName}`;

  await uploadBlobWithProgress({
    storagePath,
    file: input.file,
    safeName,
    mimeType: valid.mimeType,
    accessToken: session.access_token,
    signal: input.signal,
    onProgress: input.onProgress,
  });

  if (input.signal?.aborted) {
    await removeStorageObjectQuietly(storagePath);
    throw new UploadCancelledError();
  }

  input.onProgress?.(97, valid.fileSize, valid.fileSize);

  const {data, error: insertError} = await supabase
    .from('files')
    .insert({
      id: fileUuid,
      project_id: valid.projectId,
      uploaded_by: authenticatedUid,
      name: valid.fileName.slice(0, 260),
      storage_path: storagePath,
      size_bytes: valid.fileSize,
      mime_type: valid.mimeType,
    })
    .select(FILE_SELECT)
    .single();

  if (insertError || !data) {
    await removeStorageObjectQuietly(storagePath);
    throw new Error(getErrorMessage(insertError, 'Unable to save file record.'));
  }

  input.onProgress?.(100, valid.fileSize, valid.fileSize);

  const row = data as unknown as FileJoinedRow;
  const signedMap = await createSignedUrlMap([storagePath]);
  return mapFileRow(row, signedMap.get(storagePath) ?? '', {
    viewerId: valid.uploadedByUid,
    viewerName: valid.uploadedByName,
    viewerRole: valid.uploadedByRole,
  });
}

export async function update(id: string, input: UpdateFileInput): Promise<ProjectFileRecord> {
  const safeId = assertSafeRecordId(id, 'file');
  const valid = parseServiceInput(updateFileInputSchema, input);
  const payload: Record<string, string> = {};
  if (valid.name !== undefined) payload.name = valid.name.slice(0, 260);

  const {data, error} = await supabase
    .from('files')
    .update(payload)
    .eq('id', safeId)
    .select(FILE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to update file metadata.'));
  }

  const row = data as unknown as FileJoinedRow;
  const signedMap = await createSignedUrlMap([String(row.storage_path ?? '')]);
  return mapFileRow(row, signedMap.get(String(row.storage_path ?? '')) ?? '');
}

export async function remove(id: string): Promise<void> {
  const safeId = assertSafeRecordId(id, 'file');
  // Delete metadata row FIRST so Postgres RLS gates removal before touching Storage
  const {data: deletedRow, error: deleteError} = await supabase
    .from('files')
    .delete()
    .eq('id', safeId)
    .select('id, storage_path')
    .maybeSingle();

  if (deleteError) {
    throw new Error(getErrorMessage(deleteError, 'Unable to delete file record.'));
  }
  if (!deletedRow) {
    throw new Error('File not found or you do not have permission to delete it.');
  }

  const storagePath = String(deletedRow.storage_path ?? '').trim();
  if (isSafeStoragePath(storagePath)) {
    const {error: storageError} = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      const msg = (storageError.message || '').toLowerCase();
      const statusCode =
        'statusCode' in storageError ? Number(storageError.statusCode) : 0;
      const isNotFound = statusCode === 404 || msg.includes('not found');
      if (!isNotFound) {
        console.warn(
          '[files.ts] File record deleted, but storage cleanup failed:',
          storagePath,
          storageError,
        );
      }
    }
  }
}
