import {supabase} from '../lib/supabase';
import type {UpdateRow} from '../types/database';
import type {ProjectUpdateRecord} from '../types/portal';
import {getErrorMessage} from './serviceUtils';

interface UpdateJoinedRow extends UpdateRow {
  projects?: {title?: string | null; client_id?: string | null} | null;
  profiles?: {full_name?: string | null} | null;
}

export interface ListUpdatesOptions {
  projectId?: string;
  clientId?: string;
  limit?: number;
}

export interface CreateUpdateInput {
  projectId: string;
  authorId: string;
  message: string;
  attachments?: string[];
}

export interface UpdateUpdateInput {
  message: string;
  attachments?: string[];
}

const ATTACHMENT_MARKER = '\n<!--stackdev-attachments:';
const ATTACHMENT_SUFFIX = '-->';

function encodeUpdateBody(message: string, attachments?: string[]): string {
  const cleanMessage = message.trim();
  const safeAttachments = (attachments ?? []).filter((src) => typeof src === 'string' && src.length > 0);
  if (safeAttachments.length === 0) {
    return cleanMessage;
  }
  return `${cleanMessage}${ATTACHMENT_MARKER}${JSON.stringify(safeAttachments)}${ATTACHMENT_SUFFIX}`;
}

function decodeUpdateBody(rawBody: string): {message: string; attachments: string[]} {
  const markerIndex = rawBody.lastIndexOf(ATTACHMENT_MARKER);
  if (markerIndex === -1 || !rawBody.endsWith(ATTACHMENT_SUFFIX)) {
    return {message: rawBody, attachments: []};
  }

  const messagePart = rawBody.slice(0, markerIndex);
  const jsonPart = rawBody.slice(
    markerIndex + ATTACHMENT_MARKER.length,
    rawBody.length - ATTACHMENT_SUFFIX.length,
  );

  try {
    const parsed = JSON.parse(jsonPart);
    if (Array.isArray(parsed)) {
      return {
        message: messagePart,
        attachments: parsed.map((item) => String(item)),
      };
    }
  } catch {
    // Fall back to returning full body if marker payload is malformed
  }

  return {message: rawBody, attachments: []};
}

function mapUpdateRow(row: UpdateJoinedRow): ProjectUpdateRecord {
  const decoded = decodeUpdateBody(String(row.body ?? ''));
  return {
    id: String(row.id),
    clientId: String(row.projects?.client_id ?? ''),
    projectId: String(row.project_id ?? ''),
    projectTitle: String(row.projects?.title ?? ''),
    message: decoded.message,
    authorName: String(row.profiles?.full_name || 'Stack Dev'),
    authorId: row.author_id ? String(row.author_id) : '',
    attachments: decoded.attachments,
    createdAt: row.created_at,
  };
}

const UPDATE_SELECT =
  'id, project_id, author_id, body, created_at, projects!inner(title, client_id), profiles(full_name)';

export async function list(options: ListUpdatesOptions = {}): Promise<ProjectUpdateRecord[]> {
  let query = supabase
    .from('updates')
    .select(UPDATE_SELECT)
    .order('created_at', {ascending: false});

  if (options.projectId) {
    query = query.eq('project_id', options.projectId);
  }
  if (options.clientId) {
    query = query.eq('projects.client_id', options.clientId);
  }
  if (options.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const {data, error} = await query;
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load project updates.'));
  }

  return ((data ?? []) as unknown as UpdateJoinedRow[]).map(mapUpdateRow);
}

export async function getById(id: string): Promise<ProjectUpdateRecord | null> {
  const {data, error} = await supabase
    .from('updates')
    .select(UPDATE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load update.'));
  }
  if (!data) return null;

  return mapUpdateRow(data as unknown as UpdateJoinedRow);
}

export async function create(input: CreateUpdateInput): Promise<ProjectUpdateRecord> {
  const {data, error} = await supabase
    .from('updates')
    .insert({
      project_id: input.projectId,
      author_id: input.authorId || null,
      body: encodeUpdateBody(input.message, input.attachments),
    })
    .select(UPDATE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to post project update.'));
  }

  return mapUpdateRow(data as unknown as UpdateJoinedRow);
}

export async function update(id: string, input: UpdateUpdateInput): Promise<ProjectUpdateRecord> {
  const {data, error} = await supabase
    .from('updates')
    .update({
      body: encodeUpdateBody(input.message, input.attachments),
    })
    .eq('id', id)
    .select(UPDATE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to edit update.'));
  }

  return mapUpdateRow(data as unknown as UpdateJoinedRow);
}

export async function remove(id: string): Promise<void> {
  const {error} = await supabase.from('updates').delete().eq('id', id);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete update.'));
  }
}
