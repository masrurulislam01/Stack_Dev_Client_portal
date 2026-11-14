import {Check, CheckCheck, Download, Eye, File as FileIcon} from 'lucide-react';
import type {ProjectMessageAttachment, ProjectMessageRecord} from '@/types/portal';
import {getAvatarToneClass, getInitials} from '@/utils/avatar';
import {
  formatFileSize,
  isImageExtension,
  isPdfFile,
  isPreviewableFile,
  isTrustedStorageUrl,
} from '@/utils/fileSharing';
import {formatChatDayLabel, formatChatTime} from '@/utils/format';

interface MessageBubbleProps {
  message: ProjectMessageRecord;
  previousMessage?: ProjectMessageRecord;
  viewerRole: 'admin' | 'client';
  onPreviewAttachment: (att: ProjectMessageAttachment, msg: ProjectMessageRecord) => void;
  onDownloadAttachment: (att: ProjectMessageAttachment) => void;
}

export function MessageBubble({
  message: msg,
  previousMessage,
  viewerRole,
  onPreviewAttachment,
  onDownloadAttachment,
}: MessageBubbleProps) {
  const isOwn = msg.senderRole === viewerRole;
  const currentDay = formatChatDayLabel(msg.createdAt);
  const prevDay = previousMessage ? formatChatDayLabel(previousMessage.createdAt) : null;
  const showDayDivider = !previousMessage || currentDay !== prevDay;
  const isReadByRecipient = msg.senderRole === 'admin' ? msg.readByClient : msg.readByAdmin;

  const att = msg.attachment;
  const attName = att?.name || 'Attachment';
  const attExt = att?.extension || '';
  const attSize = att && Number.isFinite(att.size) ? att.size : 0;
  const senderLabel = msg.senderName || 'User';
  const attIsImage = att ? isImageExtension(attExt, att.mimeType) : false;
  const attIsPreviewable = att ? isPreviewableFile(attExt, att.mimeType) : false;

  return (
    <div className="space-y-3">
      {showDayDivider && (
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-semibold text-muted shadow-xs">
            {currentDay}
          </span>
        </div>
      )}

      <div className={`flex items-end gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mb-0.5 ${getAvatarToneClass(
              senderLabel,
            )}`}
            aria-hidden="true"
          >
            {getInitials(senderLabel)}
          </div>
        )}

        <div className={`flex flex-col max-w-[85%] sm:max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
          <div
            className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted ${
              isOwn ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <span className="font-semibold text-body">
              {isOwn ? `${senderLabel} (You)` : senderLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="num">{formatChatTime(msg.createdAt)}</span>
          </div>

          <div
            className={`w-full rounded-2xl px-4 py-2.5 shadow-xs space-y-2 ${
              isOwn
                ? 'bg-primary-600 text-white rounded-br-sm'
                : 'bg-surface border border-border text-foreground rounded-bl-sm'
            }`}
          >
            {att && attIsImage && isTrustedStorageUrl(att.downloadUrl) && (
              <button
                type="button"
                onClick={() => onPreviewAttachment(att, msg)}
                className="block w-full overflow-hidden rounded-xl border border-border/30 cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <img
                  src={att.downloadUrl}
                  alt={attName}
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
                    ? 'bg-primary-700/80 text-white border border-white/15'
                    : 'bg-surface-muted border border-border text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="w-4 h-4 shrink-0 opacity-85" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{attName}</p>
                    <p className={`text-[11px] num ${isOwn ? 'text-white/80' : 'text-muted'}`}>
                      {(attExt || 'FILE').toUpperCase()} · {formatFileSize(attSize)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {attIsPreviewable && isPdfFile(attExt, att.mimeType) && (
                    <button
                      type="button"
                      onClick={() => onPreviewAttachment(att, msg)}
                      aria-label={`Preview ${attName}`}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isOwn
                          ? 'hover:bg-primary-800 text-white'
                          : 'hover:bg-surface text-muted hover:text-primary-600'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDownloadAttachment(att)}
                    aria-label={`Download ${attName}`}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isOwn
                        ? 'hover:bg-primary-800 text-white'
                        : 'hover:bg-surface text-muted hover:text-primary-600'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {att && attIsImage && (
              <div className="flex items-center justify-between gap-2 text-[11px] opacity-90">
                <span className="truncate">{attName}</span>
                <button
                  type="button"
                  onClick={() => onDownloadAttachment(att)}
                  className="inline-flex items-center gap-1 font-semibold hover:underline shrink-0 cursor-pointer"
                >
                  <Download className="w-3 h-3" aria-hidden="true" />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          {isOwn && (
            <span className="mt-1 px-1 inline-flex items-center gap-1 text-[10px] font-medium text-subtle">
              {isReadByRecipient ? (
                <>
                  <CheckCheck className="w-3 h-3 text-primary-600" aria-hidden="true" />
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
    </div>
  );
}
