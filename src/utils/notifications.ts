import {dispatchNotification} from '../services/notifications';
import type {NotificationType} from '../types/portal';

export interface CreateNotificationInput {
  recipientRole: 'admin' | 'client';
  clientId: string;
  projectId?: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  actorUid: string;
  actorName: string;
}

export async function createNotification({
  recipientRole,
  clientId,
  type,
  title,
  body,
  link,
  actorUid,
}: CreateNotificationInput): Promise<void> {
  if (!actorUid.trim()) return;
  if (recipientRole === 'client' && !clientId.trim()) return;

  await dispatchNotification({
    recipientRole,
    clientId: clientId.trim(),
    type,
    title,
    body,
    link,
  });
}
