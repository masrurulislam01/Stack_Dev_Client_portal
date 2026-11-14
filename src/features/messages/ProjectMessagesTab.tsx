import {MessageSquare, Paperclip} from 'lucide-react';
import {Button, Card, ErrorAlert, Skeleton} from '@/components/ui';
import {FilePreviewModal} from '@/features/files/FilePreviewModal';
import {MessageBubble} from '@/features/messages/MessageBubble';
import {MessageComposer} from '@/features/messages/MessageComposer';
import {useProjectMessages} from '@/features/messages/useProjectMessages';
import type {PortalUser} from '@/hooks/useAuth';
import type {ProjectRecord} from '@/types/portal';
import {getAvatarToneClass, getInitials} from '@/utils/avatar';

interface ProjectMessagesTabProps {
  project: ProjectRecord;
  user: PortalUser;
  compactHeight?: boolean;
}

export function ProjectMessagesTab({
  project,
  user,
  compactHeight = false,
}: ProjectMessagesTabProps) {
  const chat = useProjectMessages(project, user);
  const partnerTitle =
    user.role === 'admin' ? `${project.clientName || 'Client'} · Project Chat` : 'Stack Dev Team';
  const partnerInitialsSource = user.role === 'admin' ? project.clientName || 'Client' : 'Stack Dev';

  return (
    <Card
      onDragEnter={chat.handleDragEnter}
      onDragOver={chat.handleDragOver}
      onDragLeave={chat.handleDragLeave}
      onDrop={chat.handleDrop}
      className={`relative overflow-hidden flex flex-col ${
        chat.isDragging ? 'border-primary-600 ring-[3px] ring-ring' : ''
      }`}
    >
      {chat.isDragging && (
        <div className="absolute inset-0 z-20 bg-primary-50/85 backdrop-blur-[2px] flex items-center justify-center p-6 pointer-events-none">
          <div className="rounded-2xl bg-surface border-2 border-dashed border-primary-600 px-6 py-5 text-center shadow-lg">
            <p className="text-sm font-semibold text-primary-700">
              Drop a file to attach to your message
            </p>
            <p className="text-xs text-muted mt-1">
              Images, PDF, ZIP, DOC/DOCX, XLS/XLSX · Max 25 MB
            </p>
          </div>
        </div>
      )}

      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarToneClass(
              partnerInitialsSource,
            )}`}
            aria-hidden="true"
          >
            {getInitials(partnerInitialsSource)}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-semibold text-foreground truncate">
              {partnerTitle}
            </h3>
            <p className="text-xs text-muted truncate">{project.title || 'Untitled Project'}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-success-text bg-success-soft border border-success/25 px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
          Live
        </span>
      </div>

      <div
        className={`flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-background/60 ${
          compactHeight ? 'h-[380px] sm:h-[460px]' : 'h-[420px] sm:h-[500px]'
        }`}
      >
        {chat.loadErrorMessage && (
          <ErrorAlert
            message={chat.loadErrorMessage}
            onRetry={() => void chat.refetchMessages()}
            retrying={chat.retrying}
          />
        )}

        {chat.loading ? (
          <div className="space-y-4">
            <div className="flex flex-col items-start space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-14 w-2/3 rounded-2xl" />
            </div>
            <div className="flex flex-col items-end space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-1/2 rounded-2xl" />
            </div>
            <div className="flex flex-col items-start space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-16 w-3/4 rounded-2xl" />
            </div>
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="font-heading text-sm font-semibold text-foreground">No messages yet</p>
            <p className="mt-1 text-xs text-muted max-w-xs leading-relaxed">
              Start a conversation with{' '}
              {user.role === 'admin' ? project.clientName || 'the client' : 'your Stack Dev team'}{' '}
              or attach a file below.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => chat.fileInputRef.current?.click()}
              icon={<Paperclip className="w-3.5 h-3.5" aria-hidden="true" />}
              className="mt-4"
            >
              Attach a file
            </Button>
          </div>
        ) : (
          chat.messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              previousMessage={index > 0 ? chat.messages[index - 1] : undefined}
              viewerRole={user.role}
              onPreviewAttachment={chat.openAttachmentPreview}
              onDownloadAttachment={(att) => void chat.handleAttachmentDownload(att)}
            />
          ))
        )}
        <div ref={chat.messagesEndRef} />
      </div>

      <MessageComposer
        text={chat.text}
        onTextChange={chat.setText}
        onKeyDown={chat.handleTextareaKeyDown}
        onSubmit={(e) => void chat.handleSendMessage(e)}
        sending={chat.sending}
        pendingAttachment={chat.pendingAttachment}
        uploadProgress={chat.uploadProgress}
        onClearAttachment={() => chat.setPendingAttachment(null)}
        onAbortUpload={chat.abortUpload}
        fileInputRef={chat.fileInputRef}
        onFileInputChange={chat.handleFileInputChange}
        combinedError={chat.combinedError}
        hasLocalError={chat.hasLocalError}
        onClearError={chat.clearLocalError}
      />

      <FilePreviewModal file={chat.previewFile} onClose={() => chat.setPreviewFile(null)} />
    </Card>
  );
}
