import {supabase} from '../lib/supabase';
import type {DbMilestoneStatus, MilestoneRow} from '../types/database';
import type {MilestoneRecord, MilestoneStatus} from '../types/portal';
import {getErrorMessage} from './serviceUtils';

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

const VALID_STATUSES: MilestoneStatus[] = [
  'Pending',
  'In Review',
  'Approved',
  'Changes Requested',
];

function mapMilestoneRow(row: MilestoneJoinedRow): MilestoneRecord {
  const status: MilestoneStatus = VALID_STATUSES.includes(row.status)
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
  const {data, error} = await supabase
    .from('milestones')
    .insert({
      project_id: input.projectId,
      title: input.title.trim(),
      description: (input.description ?? '').trim(),
      due_date: input.dueDate || null,
      status: (input.status ?? 'Pending') as DbMilestoneStatus,
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
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.dueDate !== undefined) payload.due_date = input.dueDate || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.reviewComment !== undefined) payload.feedback = input.reviewComment.trim();

  if (input.resetReviewMeta) {
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
  const cleanFeedback = decision === 'Changes Requested' ? feedback.trim() : '';
  if (decision === 'Changes Requested' && !cleanFeedback) {
    throw new Error('Please describe the changes you would like before submitting.');
  }

  const {data, error} = await supabase
    .from('milestones')
    .update({
      status: decision,
      feedback: cleanFeedback,
    })
    .eq('id', id)
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
