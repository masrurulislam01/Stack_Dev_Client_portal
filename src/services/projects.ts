import {PROJECT_STATUSES} from '@/lib/constants';
import {supabase} from '@/lib/supabase';
import {getErrorMessage, parseApiInput} from '@/services/serviceUtils';
import type {DbProjectPackage, DbProjectStatus, ProjectRow} from '@/types/database';
import {
  createProjectApiSchema,
  updateProjectApiSchema,
  type ProjectPackage,
  type ProjectRecord,
  type ProjectStatus,
} from '@/types/portal';

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
  const validated = parseApiInput(createProjectApiSchema, input);

  const {data, error} = await supabase
    .from('projects')
    .insert({
      title: validated.title,
      client_id: validated.clientId,
      package: validated.package as DbProjectPackage,
      status: validated.status as DbProjectStatus,
      progress: Math.min(100, Math.max(0, Math.round(validated.progress))),
      start_date: validated.startDate || null,
      due_date: validated.dueDate || null,
      revisions_allowed: Math.max(0, Math.round(validated.revisionsAllowed)),
      revisions_used: Math.max(0, Math.round(validated.revisionsUsed)),
      description: validated.description,
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
  const validated = parseApiInput(updateProjectApiSchema, input);
  const payload: Record<string, unknown> = {};
  if (validated.title !== undefined) payload.title = validated.title;
  if (validated.clientId !== undefined) payload.client_id = validated.clientId;
  if (validated.package !== undefined) payload.package = validated.package;
  if (validated.status !== undefined) payload.status = validated.status;
  if (validated.progress !== undefined) {
    payload.progress = Math.min(100, Math.max(0, Math.round(validated.progress)));
  }
  if (validated.startDate !== undefined) payload.start_date = validated.startDate || null;
  if (validated.dueDate !== undefined) payload.due_date = validated.dueDate || null;
  if (validated.revisionsAllowed !== undefined) {
    payload.revisions_allowed = Math.max(0, Math.round(validated.revisionsAllowed));
  }
  if (validated.revisionsUsed !== undefined) {
    payload.revisions_used = Math.max(0, Math.round(validated.revisionsUsed));
  }
  if (validated.description !== undefined) {
    payload.description = validated.description;
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
