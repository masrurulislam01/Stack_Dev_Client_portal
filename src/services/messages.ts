import {supabase} from '../lib/supabase';
import type {MessageReadRow, MessageRow} from '../types/database';
import type {ProjectMessageAttachment, ProjectMessageRecord} from '../types/portal';
import {getFileExtension} from '../utils/fileSharing';
import {createSignedUrlMap} from './files';
import {getErrorMessage} from './serviceUtils';

interface JoinedFileMeta {
  id?: string | null;
  name?: string | null;
  storage_path?: string | null;
  size_bytes?: number | null;
  mime_type?: string | null;
}

interface MessageJoinedRow extends MessageRow {
  projects?: {title?: string | null; client_id?: string | null} | null;
  profiles?: {full_name?: string | null; role?: string | null} | null;
  files?: JoinedFileMeta | null;
  message_reads?: Pick<MessageReadRow, 'message_id' | 'user_id' | 'read_at'>[] | null;
}

export interface ListMessagesOptions {
  projectId?: string;
  clientId?: string;
  viewerId?: string;
  viewerName?: string;
  viewerRole?: 'admin' | 'client';
}

export interface CreateMessageInput {
  projectId: string;
  senderId: string;
  text: string;
  fileId?: string | null;
  senderName?: string;
  senderRole?: 'admin' | 'client';
}

export interface UpdateMessageInput {
  text: string;
}

function mapMessageRow(
  row: MessageJoinedRow,
  signedUrlMap: Map<string, string>,
  viewer?: {viewerId?: string; viewerName?: string; viewerRole?: 'admin' | 'client'},
): ProjectMessageRecord {
  const senderId = String(row.sender_id ?? '');
  const isViewer = Boolean(viewer?.viewerId && senderId === viewer.viewerId);

  const senderRole: 'admin' | 'client' =
    row.profiles?.role === 'admin'
      ? 'admin'
      : row.profiles?.role === 'client'
        ? 'client'
        : isViewer && viewer?.viewerRole
          ? viewer.viewerRole
          : viewer?.viewerRole === 'client'
            ? 'admin'
            : 'client';

  const senderName =
    row.profiles?.full_name ||
    (isViewer && viewer?.viewerName ? viewer.viewerName : '') ||
    (senderRole === 'admin' ? 'Stack Dev' : 'Client');

  const reads = Array.isArray(row.message_reads) ? row.message_reads : [];
  const hasOtherUserRead = reads.some((r) => String(r.user_id) !== senderId);

  const readByAdmin = senderRole === 'admin' || hasOtherUserRead;
  const readByClient = senderRole === 'client' || hasOtherUserRead;

  let attachment: ProjectMessageAttachment | null = null;
  if (row.files && row.files.id) {
    const fileName = String(row.files.name ?? 'Attachment');
    const storagePath = String(row.files.storage_path ?? '');
    attachment = {
      fileId: String(row.files.id),
      name: fileName,
      size: Number(row.files.size_bytes ?? 0),
      mimeType: String(row.files.mime_type ?? ''),
      extension: getFileExtension(fileName),
      downloadUrl: signedUrlMap.get(storagePath) ?? '',
      storagePath,
    };
  }

  return {
    id: String(row.id),
    clientId: String(row.projects?.client_id ?? ''),
    projectId: String(row.project_id ?? ''),
    projectTitle: String(row.projects?.title ?? ''),
    text: String(row.body ?? ''),
    senderUid: senderId,
    senderName,
    senderRole,
    attachment,
    readByAdmin,
    readByClient,
    createdAt: row.created_at,
  };
}

const MESSAGE_SELECT =
  'id, project_id, sender_id, body, file_id, created_at, projects!inner(title, client_id), profiles(full_name, role), files(id, name, storage_path, size_bytes, mime_type), message_reads(message_id, user_id, read_at)';

export async function list(options: ListMessagesOptions = {}): Promise<ProjectMessageRecord[]> {
  let query = supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .order('created_at', {ascending: true});

  if (options.projectId) {
    query = query.eq('project_id', options.projectId);
  }
  if (options.clientId) {
    query = query.eq('projects.client_id', options.clientId);
  }

  const {data, error} = await query;
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load messages.'));
  }

  const rows = (data ?? []) as unknown as MessageJoinedRow[];
  const storagePaths = rows
    .map((r) => (r.files?.storage_path ? String(r.files.storage_path) : ''))
    .filter(Boolean);
  const signedMap = await createSignedUrlMap(storagePaths);

  return rows.map((row) => mapMessageRow(row, signedMap, options));
}

export async function getById(
  id: string,
  viewer?: {viewerId?: string; viewerName?: string; viewerRole?: 'admin' | 'client'},
): Promise<ProjectMessageRecord | null> {
  const {data, error} = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load message.'));
  }
  if (!data) return null;

  const row = data as unknown as MessageJoinedRow;
  const signedMap = row.files?.storage_path
    ? await createSignedUrlMap([String(row.files.storage_path)])
    : new Map<string, string>();

  return mapMessageRow(row, signedMap, viewer);
}

export async function create(input: CreateMessageInput): Promise<ProjectMessageRecord> {
  const {data, error} = await supabase
    .from('messages')
    .insert({
      project_id: input.projectId,
      sender_id: input.senderId,
      body: input.text.trim(),
      file_id: input.fileId ?? null,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to send message.'));
  }

  const row = data as unknown as MessageJoinedRow;
  const signedMap = row.files?.storage_path
    ? await createSignedUrlMap([String(row.files.storage_path)])
    : new Map<string, string>();

  return mapMessageRow(row, signedMap, {
    viewerId: input.senderId,
    viewerName: input.senderName,
    viewerRole: input.senderRole,
  });
}

export async function update(id: string, input: UpdateMessageInput): Promise<ProjectMessageRecord> {
  const {data, error} = await supabase
    .from('messages')
    .update({body: input.text.trim()})
    .eq('id', id)
    .select(MESSAGE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to update message.'));
  }

  const row = data as unknown as MessageJoinedRow;
  const signedMap = row.files?.storage_path
    ? await createSignedUrlMap([String(row.files.storage_path)])
    : new Map<string, string>();

  return mapMessageRow(row, signedMap);
}

export async function remove(id: string): Promise<void> {
  const {error} = await supabase.from('messages').delete().eq('id', id);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete message.'));
  }
}

export async function markThreadRead(messageIds: string[], userId: string): Promise<void> {
  if (messageIds.length === 0 || !userId) return;

  const payload = messageIds.map((messageId) => ({
    message_id: messageId,
    user_id: userId,
  }));

  const {error} = await supabase
    .from('message_reads')
    .upsert(payload, {onConflict: 'message_id,user_id', ignoreDuplicates: true});

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to update message read status.'));
  }
}

export async function countUnread(options: {
  viewerId: string;
  viewerRole: 'admin' | 'client';
  clientId?: string;
  projectId?: string;
}): Promise<number> {
  const messages = await list({
    clientId: options.clientId,
    projectId: options.projectId,
    viewerId: options.viewerId,
    viewerRole: options.viewerRole,
  });

  return messages.reduce((total, m) => {
    const isUnread = options.viewerRole === 'admin' ? !m.readByAdmin : !m.readByClient;
    return isUnread ? total + 1 : total;
  }, 0);
}

/**
 * Subscribe to Supabase Realtime updates ONLY on `messages` and `message_reads`.
 */
export function subscribeToMessages(
  onChange: () => void,
  projectId?: string,
): () => void {
  const suffix = projectId ? `project-${projectId}` : `global-${Math.random().toString(36).slice(2, 8)}`;
  const channel = supabase
    .channel(`messages-rt-${suffix}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        ...(projectId ? {filter: `project_id=eq.${projectId}`} : {}),
      },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_reads',
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
