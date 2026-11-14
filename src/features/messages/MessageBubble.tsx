import {Check, CheckCheck, Download, Eye, File as FileIcon} from 'lucide-react';
import type {
  ProjectFileRecord,
  ProjectMessageAttachment,
  ProjectMessageRecord,
} from '@/types/portal';
import {
  formatFileSize,
  isImageExtension,
  isPdfFile,
  isPreviewableFile,
  isTrustedStorageUrl,
} from '@/utils/fileSharing';
import {formatChatDayLabel, formatChatTime} from '@/utils/format';

function attachmentToFileRecord(
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

interface MessageBubbleProps {
  message: ProjectMessageRecord;
  viewerRole: 'admin' | 'client';
  showDayDivider: boolean;
  onPreviewAttachment: (file: ProjectFileRecord) => void;
  onDownloadAttachment: (attachment: ProjectMessageAttachment) => void;
}

export function MessageBubble({
  message: msg,
  viewerRole,
  showDayDivider,
  onPreviewAttachment,
  onDownloadAttachment,
}: MessageBubbleProps) {
  const isOwn = msg.senderRole === viewerRole;
  const currentDay = formatChatDayLabel(msg.createdAt);
  const isReadByRecipient =
    msg.senderRole === 'admin' ? msg.readByClient : msg.readByAdmin;

  const att = msg.attachment;
  const attIsImage = att ? isImageExtension(att.extension, att.mimeType) : false;
  const attIsPreviewable = att ? isPreviewableFile(att.extension, att.mimeType) : false;

  return (
    <div className="space-y-3">
      {showDayDivider && (
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            {currentDay}
          </span>
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400 ${
            isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {isOwn ? `${msg.senderName} (You)` : msg.senderName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{formatChatTime(msg.createdAt)}</span>
        </div>

        <div
          className={`max-w-[85%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 shadow-xs space-y-2 ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm'
          }`}
        >
          {att && attIsImage && isTrustedStorageUrl(att.downloadUrl) && (
            <button
              type="button"
              onClick={() => onPreviewAttachment(attachmentToFileRecord(att, msg))}
              className="block w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <img
                src={att.downloadUrl}
                alt={att.name}
                referrerPolicy="no-referrer"
                className="max-h-56 w-full object-cover hover:opacity-95 transition-opacity"
              />
            </button>
          )}

          {msg.text && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {msg.text}
            </p>
          )}

          {att && !attIsImage && (
            <div
              className={`rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs ${
                isOwn
                  ? 'bg-indigo-700/70 text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileIcon className="w-4 h-4 shrink-0 opacity-80" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{att.name}</p>
                  <p
                    className={`text-[11px] tabular-nums ${
                      isOwn ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {att.extension.toUpperCase()} · {formatFileSize(att.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {attIsPreviewable && isPdfFile(att.extension, att.mimeType) && (
                  <button
                    type="button"
                    onClick={() => onPreviewAttachment(attachmentToFileRecord(att, msg))}
                    aria-label={`Preview ${att.name}`}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isOwn
                        ? 'hover:bg-indigo-800 text-white'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDownloadAttachment(att)}
                  aria-label={`Download ${att.name}`}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isOwn
                      ? 'hover:bg-indigo-800 text-white'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {att && attIsImage && (
            <div className="flex items-center justify-between gap-2 text-[11px] opacity-90">
              <span className="truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => onDownloadAttachment(att)}
                className="inline-flex items-center gap-1 font-medium hover:underline shrink-0"
              >
                <Download className="w-3 h-3" aria-hidden="true" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {isOwn && (
          <span className="mt-0.5 px-1 inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
            {isReadByRecipient ? (
              <>
                <CheckCheck className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                <span>Read</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3" aria-hidden="true" />
                <span>Sent</span>
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
