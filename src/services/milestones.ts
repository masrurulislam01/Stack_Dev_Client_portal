import {MILESTONE_STATUSES} from '@/lib/constants';
import {supabase} from '@/lib/supabase';
import {getErrorMessage, parseApiInput} from '@/services/serviceUtils';
import type {DbMilestoneStatus, MilestoneRow} from '@/types/database';
import {
  clientMilestoneReviewApiSchema,
  createMilestoneApiSchema,
  updateMilestoneApiSchema,
  type MilestoneRecord,
  type MilestoneStatus,
} from '@/types/portal';

interface MilestoneJoinedRow extends MilestoneRow {
  projects?: {client_id?: string | null} | null;
  profiles?: {full_name?: string | null} | null;
}

export interface ListMilestonesOptions {
  projectId?: string;
  clientId?: string;
}

export interface CreateMilestoneInput {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: MilestoneStatus;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: MilestoneStatus;
  reviewComment?: string;
  resetReviewMeta?: boolean;
}

function mapMilestoneRow(row: MilestoneJoinedRow): MilestoneRecord {
  const status: MilestoneStatus = MILESTONE_STATUSES.includes(row.status)
    ? row.status
    : 'Pending';

  const reviewedBy = row.reviewed_by ? String(row.reviewed_by) : '';
  const profileName = row.profiles?.full_name ? String(row.profiles.full_name) : '';

  return {
    id: String(row.id),
    clientId: String(row.projects?.client_id ?? ''),
    projectId: String(row.project_id ?? ''),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    dueDate: row.due_date ? String(row.due_date) : '',
    status,
    reviewComment: String(row.feedback ?? ''),
    actionByName: profileName || (reviewedBy ? 'Reviewer' : ''),
    actionByUid: reviewedBy,
    actionAt: row.reviewed_at ?? null,
    createdAt: row.created_at,
  };
}

const MILESTONE_SELECT =
  'id, project_id, title, description, due_date, status, reviewed_by, reviewed_at, feedback, created_at, projects!inner(client_id), profiles(full_name)';

export async function list(options: ListMilestonesOptions = {}): Promise<MilestoneRecord[]> {
  let query = supabase
    .from('milestones')
    .select(MILESTONE_SELECT)
    .order('due_date', {ascending: true, nullsFirst: false});

  if (options.projectId) {
    query = query.eq('project_id', options.projectId);
  }
  if (options.clientId) {
    query = query.eq('projects.client_id', options.clientId);
  }

  const {data, error} = await query;
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load milestones.'));
  }

  return ((data ?? []) as unknown as MilestoneJoinedRow[]).map(mapMilestoneRow);
}

export async function getById(id: string): Promise<MilestoneRecord | null> {
  const {data, error} = await supabase
    .from('milestones')
    .select(MILESTONE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load milestone details.'));
  }
  if (!data) return null;

  return mapMilestoneRow(data as unknown as MilestoneJoinedRow);
}

export async function create(input: CreateMilestoneInput): Promise<MilestoneRecord> {
  const validated = parseApiInput(createMilestoneApiSchema, input);

  const {data, error} = await supabase
    .from('milestones')
    .insert({
      project_id: validated.projectId,
      title: validated.title,
      description: validated.description ?? '',
      due_date: validated.dueDate || null,
      status: (validated.status ?? 'Pending') as DbMilestoneStatus,
    })
    .select(MILESTONE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to create milestone.'));
  }

  return mapMilestoneRow(data as unknown as MilestoneJoinedRow);
}

export async function update(
  id: string,
  input: UpdateMilestoneInput,
): Promise<MilestoneRecord> {
  const validated = parseApiInput(updateMilestoneApiSchema, input);
  const payload: Record<string, unknown> = {};
  if (validated.title !== undefined) payload.title = validated.title;
  if (validated.description !== undefined) payload.description = validated.description;
  if (validated.dueDate !== undefined) payload.due_date = validated.dueDate || null;
  if (validated.status !== undefined) payload.status = validated.status;
  if (validated.reviewComment !== undefined) payload.feedback = validated.reviewComment;

  if (validated.resetReviewMeta) {
    payload.feedback = '';
    payload.reviewed_by = null;
    payload.reviewed_at = null;
  }

  const {data, error} = await supabase
    .from('milestones')
    .update(payload)
    .eq('id', id)
    .select(MILESTONE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to update milestone.'));
  }

  return mapMilestoneRow(data as unknown as MilestoneJoinedRow);
}

export async function submitClientReview(
  id: string,
  decision: 'Approved' | 'Changes Requested',
  feedback = '',
): Promise<MilestoneRecord> {
  const validated = parseApiInput(clientMilestoneReviewApiSchema, {
    id,
    decision,
    feedback: decision === 'Changes Requested' ? feedback : '',
  });

  const {data, error} = await supabase
    .from('milestones')
    .update({
      status: validated.decision,
      feedback: validated.feedback,
    })
    .eq('id', validated.id)
    .select(MILESTONE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to submit milestone review.'));
  }

  return mapMilestoneRow(data as unknown as MilestoneJoinedRow);
}

export async function remove(id: string): Promise<void> {
  const {error} = await supabase.from('milestones').delete().eq('id', id);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete milestone.'));
  }
}
