import {MessageSquare} from 'lucide-react';
import {FilePreviewModal} from '@/features/files/FilePreviewModal';
import {MessageBubble} from '@/features/messages/MessageBubble';
import {MessageComposer} from '@/features/messages/MessageComposer';
import {useProjectMessages} from '@/features/messages/useProjectMessages';
import type {PortalUser} from '@/hooks/useAuth';
import type {ProjectRecord} from '@/types/portal';

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

  return (
    <div
      onDragEnter={chat.handleDragEnter}
      onDragOver={chat.handleDragOver}
      onDragLeave={chat.handleDragLeave}
      onDrop={chat.handleDrop}
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden flex flex-col ${
        chat.isDragging
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {chat.isDragging && (
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

      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {partnerTitle}
          </h3>
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
        {chat.loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-14 w-2/3 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-14 w-1/2 ml-auto rounded-2xl bg-indigo-200/60 dark:bg-indigo-950/60" />
            <div className="h-16 w-3/4 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              No messages yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Start a conversation with{' '}
              {user.role === 'admin' ? project.clientName || 'the client' : 'your Stack Dev team'}{' '}
              or attach a file below.
            </p>
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
    </div>
  );
}
