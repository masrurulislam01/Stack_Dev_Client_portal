import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  CheckCheck,
  Download,
  Eye,
  File as FileIcon,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import type {PortalUser} from '../context/AuthContext';
import {useToast} from '../context/ToastContext';
import {queryKeys} from '../lib/queryKeys';
import {
  create as uploadProjectFile,
  getSignedDownloadUrl,
  SIGNED_URL_EXPIRY_SECONDS,
  UploadCancelledError,
} from '../services/files';
import {
  create as sendProjectMessage,
  list as listProjectMessages,
  markThreadRead,
  subscribeToMessages,
} from '../services/messages';
import {getErrorMessage} from '../services/serviceUtils';
import type {
  ProjectFileRecord,
  ProjectMessageAttachment,
  ProjectMessageRecord,
  ProjectRecord,
} from '../types/portal';
import {
  FILE_INPUT_ACCEPT,
  formatFileSize,
  isImageExtension,
  isPdfFile,
  isPreviewableFile,
  isTrustedStorageUrl,
  triggerFileDownload,
  validateProjectFile,
} from '../utils/fileSharing';
import {formatChatDayLabel, formatChatTime} from '../utils/format';
import {createNotification} from '../utils/notifications';
import {FilePreviewModal} from './FilePreviewModal';

interface ProjectMessagesTabProps {
  project: ProjectRecord;
  user: PortalUser;
  compactHeight?: boolean;
}

interface PendingAttachment {
  file: File;
  extension: string;
  resolvedMimeType: string;
}

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

export function ProjectMessagesTab({
  project,
  user,
  compactHeight = false,
}: ProjectMessagesTabProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [text, setText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFileRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const markingReadIdsRef = useRef<Set<string>>(new Set());
  const dragCounterRef = useRef(0);
  const uploadAbortRef = useRef<AbortController | null>(null);

  const {
    data: messages = [],
    isLoading: loading,
    error: loadError,
  } = useQuery({
    queryKey: queryKeys.messages.list({projectId: project.id}),
    queryFn: () =>
      listProjectMessages({
        projectId: project.id,
        viewerId: user.id,
        viewerName: user.name,
        viewerRole: user.role,
      }),
  });

  useEffect(() => {
    markingReadIdsRef.current.clear();
  }, [project.id]);

  useEffect(() => {
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({queryKey: queryKeys.messages.prefix});
      void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
    }, project.id);
  }, [project.id, queryClient]);

  // Mark unread messages from the other party as read whenever the thread is open
  useEffect(() => {
    const unread = messages.filter((m) => {
      if (m.senderUid === user.id) return false;
      if (markingReadIdsRef.current.has(m.id)) return false;
      return user.role === 'admin' ? !m.readByAdmin : !m.readByClient;
    });

    if (unread.length === 0) return;

    for (const m of unread) {
      markingReadIdsRef.current.add(m.id);
    }

    const run = async () => {
      try {
        await markThreadRead(
          unread.map((m) => m.id),
          user.id,
        );
        void queryClient.invalidateQueries({queryKey: queryKeys.messages.prefix});
        void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
      } catch {
        for (const m of unread) {
          markingReadIdsRef.current.delete(m.id);
        }
      }
    };

    void run();
  }, [messages, queryClient, user.id, user.role]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'});
    }
  }, [messages.length, loading]);

  const stageAttachmentFile = (file: File) => {
    setErrorMsg(null);
    const validation = validateProjectFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error);
      toast.error('Invalid attachment', validation.error);
      return;
    }
    setPendingAttachment({
      file,
      extension: validation.extension,
      resolvedMimeType: validation.resolvedMimeType,
    });
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (selected) {
      stageAttachmentFile(selected);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      stageAttachmentFile(dropped);
    }
  };

  const handleAttachmentDownload = async (att: ProjectMessageAttachment) => {
    setErrorMsg(null);
    try {
      const freshUrl = await getSignedDownloadUrl(
        att.storagePath,
        SIGNED_URL_EXPIRY_SECONDS,
      );
      await triggerFileDownload(freshUrl, att.name);
    } catch (err) {
      const message = getErrorMessage(err, `Unable to download "${att.name}".`);
      console.error('[ProjectMessagesTab] Attachment download error:', att.storagePath, err);
      setErrorMsg(message);
      toast.error('Download failed', message);
    }
  };

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !pendingAttachment) || sending) return;

    if (trimmed.length > 4000) {
      setErrorMsg('Message must be 4000 characters or fewer.');
      return;
    }

    setErrorMsg(null);
    setSending(true);

    try {
      let uploadedFileId: string | null = null;
      let uploadedFileName = '';
      if (pendingAttachment) {
        const controller = new AbortController();
        uploadAbortRef.current = controller;
        setUploadProgress(0);
        const createdFile = await uploadProjectFile({
          projectId: project.id,
          clientId: project.clientId,
          uploadedByUid: user.id,
          uploadedByName: user.name,
          uploadedByRole: user.role,
          file: pendingAttachment.file,
          mimeType: pendingAttachment.resolvedMimeType,
          signal: controller.signal,
          onProgress: (pct) => setUploadProgress(pct),
        });
        uploadAbortRef.current = null;
        uploadedFileId = createdFile.id;
        uploadedFileName = createdFile.name;
        await queryClient.invalidateQueries({queryKey: queryKeys.files.prefix});
      }

      await sendProjectMessage({
        projectId: project.id,
        senderId: user.id,
        text: trimmed || (uploadedFileName ? `Attached ${uploadedFileName}` : ''),
        fileId: uploadedFileId,
        senderName: user.name,
        senderRole: user.role,
      });

      await queryClient.invalidateQueries({queryKey: queryKeys.messages.prefix});
      await queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});

      const recipientRole = user.role === 'admin' ? 'client' : 'admin';
      const targetLink =
        recipientRole === 'admin'
          ? `/admin/projects/${project.id}?tab=messages`
          : `/projects/${project.id}?tab=messages`;
      const previewText = trimmed || `Sent a file: ${uploadedFileName || 'Attachment'}`;
      await createNotification({
        recipientRole,
        clientId: project.clientId,
        projectId: project.id,
        type: 'message',
        title: `New message on ${project.title}`,
        body: `${user.name}: ${previewText}`,
        link: targetLink,
        actorUid: user.id,
        actorName: user.name,
      });

      setText('');
      setPendingAttachment(null);
      setUploadProgress(null);
    } catch (err) {
      if (err instanceof UploadCancelledError) {
        toast.info('Upload cancelled', 'Attachment upload was cancelled.');
        setErrorMsg(null);
        return;
      }
      const message = getErrorMessage(err, 'Unable to send message. Please try again.');
      console.error('[ProjectMessagesTab] Failed to send message/attachment:', err);
      setErrorMsg(message);
      toast.error('Failed to send', message);
    } finally {
      uploadAbortRef.current = null;
      setSending(false);
      setUploadProgress(null);
    }
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const partnerTitle =
    user.role === 'admin' ? `${project.clientName || 'Client'} · Project Chat` : 'Stack Dev Team';

  const combinedError =
    errorMsg || (loadError instanceof Error ? loadError.message : null);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden flex flex-col ${
        isDragging
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-indigo-600/10 backdrop-blur-[1px] flex items-center justify-center p-6 pointer-events-none">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-600 dark:border-indigo-400 px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Drop a file to attach to your message
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Images, PDF, ZIP, DOC/DOCX, XLS/XLSX · Max 25 MB
            </p>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {partnerTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {project.title}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Live
        </span>
      </div>

      {/* Message List */}
      <div
        className={`flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-slate-50/70 dark:bg-slate-950/60 ${
          compactHeight ? 'h-[380px] sm:h-[460px]' : 'h-[420px] sm:h-[500px]'
        }`}
      >
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-14 w-2/3 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-14 w-1/2 ml-auto rounded-2xl bg-indigo-200/60 dark:bg-indigo-950/60" />
            <div className="h-16 w-3/4 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No messages yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Start a conversation with {user.role === 'admin' ? project.clientName || 'the client' : 'your Stack Dev team'} or attach a file below.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderRole === user.role;
            const currentDay = formatChatDayLabel(msg.createdAt);
            const prevDay =
              index > 0 ? formatChatDayLabel(messages[index - 1].createdAt) : null;
            const showDayDivider = index === 0 || currentDay !== prevDay;
            const isReadByRecipient =
              msg.senderRole === 'admin' ? msg.readByClient : msg.readByAdmin;

            const att = msg.attachment;
            const attIsImage = att ? isImageExtension(att.extension, att.mimeType) : false;
            const attIsPreviewable = att ? isPreviewableFile(att.extension, att.mimeType) : false;

            return (
              <div key={msg.id} className="space-y-3">
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
                        onClick={() => setPreviewFile(attachmentToFileRecord(att, msg))}
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
                              onClick={() => setPreviewFile(attachmentToFileRecord(att, msg))}
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
                            onClick={() => void handleAttachmentDownload(att)}
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
                          onClick={() => void handleAttachmentDownload(att)}
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 space-y-2.5"
      >
        {combinedError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-2 flex items-start justify-between gap-2 text-xs text-red-700 dark:text-red-300"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{combinedError}</span>
            </div>
            {errorMsg && (
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                aria-label="Dismiss error"
                className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {pendingAttachment && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {pendingAttachment.file.name}
                </span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                  ({formatFileSize(pendingAttachment.file.size)})
                </span>
              </div>
              {sending ? (
                <button
                  type="button"
                  onClick={() => uploadAbortRef.current?.abort()}
                  aria-label="Cancel attachment upload"
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-950/50"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  aria-label="Remove attachment"
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            {uploadProgress !== null && (
              <div className="h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-150"
                  style={{width: `${uploadProgress}%`}}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            onChange={handleFileInputChange}
            className="sr-only"
            aria-label="Attach file to message"
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            title="Attach file (max 25 MB)"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
          >
            <Paperclip className="w-4 h-4" aria-hidden="true" />
          </button>

          <textarea
            rows={1}
            value={text}
            disabled={sending}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Write a message..."
            className="flex-1 min-h-[40px] max-h-32 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
          />

          <button
            type="submit"
            disabled={sending || (!text.trim() && !pendingAttachment)}
            aria-label="Send message"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-colors shrink-0"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </form>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
