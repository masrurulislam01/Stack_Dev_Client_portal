import type {
  ProjectFileRecord,
  ProjectMessageAttachment,
  ProjectMessageRecord,
} from '@/types/portal';

export interface PendingAttachment {
  file: File;
  extension: string;
  resolvedMimeType: string;
}

export function attachmentToFileRecord(
  att: ProjectMessageAttachment,
  msg: ProjectMessageRecord,
): ProjectFileRecord {
  return {
    id: att.fileId,
    clientId: msg.clientId,
    projectId: msg.projectId,
    projectTitle: msg.projectTitle,
    name: att.name,
    size: att.size,
    mimeType: att.mimeType,
    extension: att.extension,
    storagePath: att.storagePath,
    downloadUrl: att.downloadUrl,
    uploadedByUid: msg.senderUid,
    uploadedByName: msg.senderName,
    uploadedByRole: msg.senderRole,
    createdAt: msg.createdAt,
  };
}
