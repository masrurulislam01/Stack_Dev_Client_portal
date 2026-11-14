import type {NotificationType} from '@/config/constants';
import {supabase} from '@/lib/supabase';
import {getErrorMessage, parseServiceInput} from '@/services/serviceUtils';
import type {NotificationRow} from '@/types/database';
import type {NotificationRecord} from '@/types/portal';
import {
  createDispatchNotificationInputSchema,
  createNotificationRowInputSchema,
  updateNotificationInputSchema,
} from '@/types/schemas';

export interface CreateNotificationRowInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
}

export interface CreateDispatchNotificationInput {
  recipientRole: 'admin' | 'client';
  clientId?: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
}

function mapNotificationRow(row: NotificationRow): NotificationRecord {
  const rawType = String(row.type ?? 'update');
  const type: NotificationType =
    rawType === 'message' ||
    rawType === 'milestone' ||
    rawType === 'invoice' ||
    rawType === 'update'
      ? rawType
      : 'update';

  return {
    id: String(row.id),
    recipientRole: 'client',
    clientId: '',
    visibleToClientId: '',
    projectId: '',
    type,
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    link: String(row.link ?? '/'),
    actorUid: '',
    actorName: '',
    read: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

export async function list(userId: string): Promise<NotificationRecord[]> {
  if (!userId) return [];

  const {data, error} = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, link, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', {ascending: false})
    .limit(30);

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load notifications.'));
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
}

export async function getById(id: string): Promise<NotificationRecord | null> {
  const {data, error} = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, link, is_read, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load notification.'));
  }
  if (!data) return null;

  return mapNotificationRow(data as NotificationRow);
}

export async function create(input: CreateNotificationRowInput): Promise<NotificationRecord> {
  const valid = parseServiceInput(createNotificationRowInputSchema, input);
  const normalizedLink = valid.link.startsWith('/')
    ? valid.link.slice(0, 300)
    : `/${valid.link}`.slice(0, 300);

  const {data, error} = await supabase
    .from('notifications')
    .insert({
      user_id: valid.userId,
      type: valid.type,
      title: valid.title.slice(0, 160) || 'Notification',
      body: valid.body.slice(0, 500) || 'New activity in your project.',
      link: normalizedLink,
      is_read: false,
    })
    .select('id, user_id, type, title, body, link, is_read, created_at')
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to create notification.'));
  }

  return mapNotificationRow(data as NotificationRow);
}

export async function dispatchNotification(
  input: CreateDispatchNotificationInput,
): Promise<void> {
  const valid = parseServiceInput(createDispatchNotificationInputSchema, input);
  const normalizedLink = valid.link.startsWith('/')
    ? valid.link.slice(0, 300)
    : `/${valid.link}`.slice(0, 300);

  try {
    let profileQuery = supabase.from('profiles').select('id');
    if (valid.recipientRole === 'admin') {
      profileQuery = profileQuery.eq('role', 'admin');
    } else if (valid.clientId) {
      profileQuery = profileQuery.eq('client_id', valid.clientId);
    } else {
      return;
    }

    const {data: recipients, error: lookupError} = await profileQuery;
    if (lookupError || !recipients || recipients.length === 0) {
      return;
    }

    const rows = recipients.map((r) => ({
      user_id: String(r.id),
      type: valid.type,
      title: valid.title.slice(0, 160) || 'Notification',
      body: valid.body.slice(0, 500) || 'New activity in your project.',
      link: normalizedLink,
      is_read: false,
    }));

    await supabase.from('notifications').insert(rows);
  } catch {
    // Non-blocking: RLS prevents clients from creating cross-user notifications directly
  }
}

export async function update(
  id: string,
  input: {isRead: boolean},
): Promise<NotificationRecord> {
  const valid = parseServiceInput(updateNotificationInputSchema, input);

  const {data, error} = await supabase
    .from('notifications')
    .update({is_read: valid.isRead})
    .eq('id', id)
    .select('id, user_id, type, title, body, link, is_read, created_at')
    .single();

  if (error || !data) {
    throw new Error(getErrorMessage(error, 'Unable to update notification.'));
  }

  return mapNotificationRow(data as NotificationRow);
}

export async function markRead(id: string): Promise<NotificationRecord> {
  return update(id, {isRead: true});
}

export async function markAllRead(userId: string): Promise<void> {
  if (!userId) return;
  const {error} = await supabase
    .from('notifications')
    .update({is_read: true})
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to mark notifications as read.'));
  }
}

export async function remove(id: string): Promise<void> {
  const {error} = await supabase.from('notifications').delete().eq('id', id);
  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to delete notification.'));
  }
}

export function subscribeToNotifications(
  userId: string,
  onChange: () => void,
): () => void {
  if (!userId) return () => {};

  const channel = supabase
    .channel(`notifications-rt-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
