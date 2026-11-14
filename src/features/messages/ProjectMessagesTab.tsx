import {useQueryClient} from '@tanstack/react-query';
import {MessageSquare} from 'lucide-react';
import {useEffect, useRef, useState, type DragEvent, type FormEvent} from 'react';
import {z} from 'zod';
import type {PortalUser} from '@/features/auth/AuthContext';
import {FilePreviewModal} from '@/features/files/FilePreviewModal';
import {MessageBubble} from '@/features/messages/MessageBubble';
import {MessageComposer, type PendingAttachment} from '@/features/messages/MessageComposer';
import {useProjectMessages, useToast} from '@/hooks';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as uploadProjectFile,
  getSignedDownloadUrl,
  SIGNED_URL_EXPIRY_SECONDS,
  UploadCancelledError,
} from '@/services/files';
import {create as sendProjectMessage, markThreadRead} from '@/services/messages';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  ProjectFileRecord,
  ProjectMessageAttachment,
  ProjectRecord,
} from '@/types/portal';
import {triggerFileDownload, validateProjectFile} from '@/utils/fileSharing';
import {formatChatDayLabel} from '@/utils/format';
import {createNotification} from '@/utils/notifications';

const messageDraftSchema = z
  .object({
    text: z.string().trim().max(4000, 'Message must be 4000 characters or fewer.'),
    hasAttachment: z.boolean(),
  })
  .refine((data) => data.text.length > 0 || data.hasAttachment, {
    message: 'Write a message or attach a file.',
  });

interface ProjectMessagesTabProps {
  project: ProjectRecord;
  user: PortalUser;
  compactHeight?: boolean;
}

export function ProjectMessagesTab({project, user, compactHeight = false}: ProjectMessagesTabProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [text, setText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFileRecord | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const markingReadIdsRef = useRef<Set<string>>(new Set());
  const dragCounterRef = useRef(0);
  const uploadAbortRef = useRef<AbortController | null>(null);

  const {data: messages = [], isLoading: loading, error: loadError} = useProjectMessages({
    projectId: project.id,
    viewerId: user.id,
    viewerName: user.name,
    viewerRole: user.role,
  });

  useEffect(() => {
    markingReadIdsRef.current.clear();
  }, [project.id]);

  useEffect(() => {
    const unread = messages.filter((m) => {
      if (m.senderUid === user.id || markingReadIdsRef.current.has(m.id)) return false;
      return user.role === 'admin' ? !m.readByAdmin : !m.readByClient;
    });
    if (unread.length === 0) return;

    unread.forEach((m) => markingReadIdsRef.current.add(m.id));
    void markThreadRead(unread.map((m) => m.id), user.id)
      .then(() => {
        void queryClient.invalidateQueries({queryKey: queryKeys.messages.prefix});
        void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
      })
      .catch(() => {
        unread.forEach((m) => markingReadIdsRef.current.delete(m.id));
      });
  }, [messages, queryClient, user.id, user.role]);

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

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) stageAttachmentFile(dropped);
  };

  const handleAttachmentDownload = async (att: ProjectMessageAttachment) => {
    setErrorMsg(null);
    try {
      const freshUrl = await getSignedDownloadUrl(att.storagePath, SIGNED_URL_EXPIRY_SECONDS);
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
    if (sending) return;
    const parsed = messageDraftSchema.safeParse({
      text,
      hasAttachment: Boolean(pendingAttachment),
    });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Invalid message.');
      return;
    }

    const trimmed = parsed.data.text;
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
      await createNotification({
        recipientRole,
        clientId: project.clientId,
        projectId: project.id,
        type: 'message',
        title: `New message on ${project.title}`,
        body: `${user.name}: ${trimmed || `Sent a file: ${uploadedFileName || 'Attachment'}`}`,
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

  const partnerTitle =
    user.role === 'admin' ? `${project.clientName || 'Client'} · Project Chat` : 'Stack Dev Team';
  const combinedError = errorMsg || (loadError instanceof Error ? loadError.message : null);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden flex flex-col ${
        isDragging ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-indigo-600/10 backdrop-blur-[1px] flex items-center justify-center p-6 pointer-events-none">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-600 dark:border-indigo-400 px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Drop a file to attach to your message</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Images, PDF, ZIP, DOC/DOCX, XLS/XLSX · Max 25 MB</p>
          </div>
        </div>
      )}

      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{partnerTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{project.title}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Live
        </span>
      </div>

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
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No messages yet</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Start a conversation with {user.role === 'admin' ? project.clientName || 'the client' : 'your Stack Dev team'} or attach a file below.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const currentDay = formatChatDayLabel(msg.createdAt);
            const prevDay = index > 0 ? formatChatDayLabel(messages[index - 1].createdAt) : null;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                viewerRole={user.role}
                showDayDivider={index === 0 || currentDay !== prevDay}
                onPreviewAttachment={setPreviewFile}
                onDownloadAttachment={(att) => void handleAttachmentDownload(att)}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageComposer
        text={text}
        onTextChange={setText}
        pendingAttachment={pendingAttachment}
        onClearAttachment={() => setPendingAttachment(null)}
        onCancelUpload={() => uploadAbortRef.current?.abort()}
        onSelectFile={stageAttachmentFile}
        onSubmit={handleSendMessage}
        sending={sending}
        uploadProgress={uploadProgress}
        error={combinedError}
        canDismissError={Boolean(errorMsg)}
        onDismissError={() => setErrorMsg(null)}
      />

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
