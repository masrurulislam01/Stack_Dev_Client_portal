import {
  PROJECT_STATUSES,
  type ProjectPackage,
  type ProjectStatus,
} from '@/config/constants';
import {supabase} from '@/lib/supabase';
import {getErrorMessage, parseServiceInput} from '@/services/serviceUtils';
import type {DbProjectPackage, DbProjectStatus, ProjectRow} from '@/types/database';
import type {ProjectRecord} from '@/types/portal';
import {createProjectInputSchema, updateProjectInputSchema} from '@/types/schemas';

interface ProjectJoinedRow extends ProjectRow {
  clients?: {company_name?: string | null} | null;
}

export interface ListProjectsOptions {
  clientId?: string;
}

export interface CreateProjectInput {
  title: string;
  clientId: string;
  package: ProjectPackage;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  dueDate: string;
  revisionsAllowed: number;
  revisionsUsed: number;
  description: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

function mapProjectRow(row: ProjectJoinedRow): ProjectRecord {
  const pkg: ProjectPackage =
    row.package === 'premium' || row.package === 'custom' ? row.package : 'basic';
  const status: ProjectStatus = PROJECT_STATUSES.includes(row.status)
    ? row.status
    : 'Planning';

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    clientId: String(row.client_id ?? ''),
    clientName: String(row.clients?.company_name ?? ''),
    package: pkg,
    status,
    progress: Number(row.progress ?? 0),
    startDate: row.start_date ? String(row.start_date) : '',
    dueDate: row.due_date ? String(row.due_date) : '',
    revisionsAllowed: Number(row.revisions_allowed ?? 0),
    revisionsUsed: Number(row.revisions_used ?? 0),
    description: String(row.description ?? ''),
    createdAt: row.created_at,
  };
}

const PROJECT_SELECT =
  'id, client_id, title, description, package, status, progress, start_date, due_date, revisions_allowed, revisions_used, created_at, clients(company_name)';

export async function list(options: ListProjectsOptions = {}): Promise<ProjectRecord[]> {
  let query = supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('created_at', {ascending: false});

  if (options.clientId) {
    query = query.eq('client_id', options.clientId);
  }

  const {data, error} = await query;
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load projects.'));
  }

  return ((data ?? []) as unknown as ProjectJoinedRow[]).map(mapProjectRow);
}

export async function getById(id: string): Promise<ProjectRecord | null> {
  const {data, error} = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load project details.'));
  }
  if (!data) return null;

  return mapProjectRow(data as unknown as ProjectJoinedRow);
}

export async function create(input: CreateProjectInput): Promise<ProjectRecord> {
  const valid = parseServiceInput(createProjectInputSchema, input);

  const {data, error} = await supabase
    .from('projects')
    .insert({
      title: valid.title,
      client_id: valid.clientId,
      package: valid.package as DbProjectPackage,
      status: valid.status as DbProjectStatus,
      progress: Math.min(100, Math.max(0, Math.round(valid.progress))),
      start_date: valid.startDate || null,
      due_date: valid.dueDate || null,
      revisions_allowed: Math.max(0, Math.round(valid.revisionsAllowed)),
      revisions_used: Math.max(0, Math.round(valid.revisionsUsed)),
      description: valid.description,
    })
    .select(PROJECT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to create project.'));
  }

  return mapProjectRow(data as unknown as ProjectJoinedRow);
}

export async function update(
  id: string,
  input: UpdateProjectInput,
): Promise<ProjectRecord> {
  const valid = parseServiceInput(updateProjectInputSchema, input);
  const payload: Record<string, unknown> = {};
  if (valid.title !== undefined) payload.title = valid.title;
  if (valid.clientId !== undefined) payload.client_id = valid.clientId;
  if (valid.package !== undefined) payload.package = valid.package;
  if (valid.status !== undefined) payload.status = valid.status;
  if (valid.progress !== undefined) {
    payload.progress = Math.min(100, Math.max(0, Math.round(valid.progress)));
  }
  if (valid.startDate !== undefined) payload.start_date = valid.startDate || null;
  if (valid.dueDate !== undefined) payload.due_date = valid.dueDate || null;
  if (valid.revisionsAllowed !== undefined) {
    payload.revisions_allowed = Math.max(0, Math.round(valid.revisionsAllowed));
  }
  if (valid.revisionsUsed !== undefined) {
    payload.revisions_used = Math.max(0, Math.round(valid.revisionsUsed));
  }
  if (valid.description !== undefined) {
    payload.description = valid.description;
  }

  const {data, error} = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select(PROJECT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to update project.'));
  }

  return mapProjectRow(data as unknown as ProjectJoinedRow);
}

export async function remove(id: string): Promise<void> {
  const {error} = await supabase.from('projects').delete().eq('id', id);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete project.'));
  }
}
