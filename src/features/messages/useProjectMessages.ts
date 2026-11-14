import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {
  attachmentToFileRecord,
  type PendingAttachment,
} from '@/features/messages/messageHelpers';
import type {PortalUser} from '@/hooks/useAuth';
import {useToast} from '@/hooks/useToast';
import {queryKeys} from '@/lib/queryKeys';
import {
  create as uploadProjectFile,
  getSignedDownloadUrl,
  SIGNED_URL_EXPIRY_SECONDS,
  UploadCancelledError,
} from '@/services/files';
import {
  create as sendProjectMessage,
  list as listProjectMessages,
  markThreadRead,
  subscribeToMessages,
} from '@/services/messages';
import {getErrorMessage} from '@/services/serviceUtils';
import type {
  ProjectFileRecord,
  ProjectMessageAttachment,
  ProjectMessageRecord,
  ProjectRecord,
} from '@/types/portal';
import {messageComposerSchema} from '@/types/schemas';
import {triggerFileDownload, validateProjectFile} from '@/utils/fileSharing';
import {createNotification} from '@/utils/notifications';

export function useProjectMessages(project: ProjectRecord, user: PortalUser) {
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

    void (async () => {
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
    })();
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

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (selected) stageAttachmentFile(selected);
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
    if (sending) return;

    const parsed = messageComposerSchema.safeParse({text});
    if (!parsed.success) {
      setErrorMsg(
        parsed.error.issues[0]?.message ?? 'Message must be 4000 characters or fewer.',
      );
      return;
    }

    const trimmed = parsed.data.text;
    if (!trimmed && !pendingAttachment) return;

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

  const openAttachmentPreview = (
    att: ProjectMessageAttachment,
    msg: ProjectMessageRecord,
  ) => {
    setPreviewFile(attachmentToFileRecord(att, msg));
  };

  return {
    messages,
    loading,
    text,
    setText,
    pendingAttachment,
    setPendingAttachment,
    sending,
    uploadProgress,
    combinedError: errorMsg || (loadError instanceof Error ? loadError.message : null),
    hasLocalError: Boolean(errorMsg),
    clearLocalError: () => setErrorMsg(null),
    isDragging,
    previewFile,
    setPreviewFile,
    fileInputRef,
    messagesEndRef,
    abortUpload: () => uploadAbortRef.current?.abort(),
    handleFileInputChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleAttachmentDownload,
    handleSendMessage,
    handleTextareaKeyDown,
    openAttachmentPreview,
  };
}
