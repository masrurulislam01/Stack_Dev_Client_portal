import {zodResolver} from '@hookform/resolvers/zod';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  FolderOpen,
  ImagePlus,
  LayoutList,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {useEffect, useState, type ChangeEvent} from 'react';
import {useForm} from 'react-hook-form';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ProjectFilesTab} from '../components/ProjectFilesTab';
import {ProjectFormModal} from '../components/ProjectFormModal';
import {ProjectInvoicesTab} from '../components/ProjectInvoicesTab';
import {ProjectMessagesTab} from '../components/ProjectMessagesTab';
import {TimelineFeed} from '../components/TimelineFeed';
import {useAuth} from '../context/AuthContext';
import {queryKeys} from '../lib/queryKeys';
import {list as listClients} from '../services/clients';
import {countUnread, subscribeToMessages} from '../services/messages';
import {
  create as createMilestone,
  list as listMilestones,
  remove as removeMilestone,
  update as updateMilestone,
} from '../services/milestones';
import {getById as getProjectById, update as updateProject} from '../services/projects';
import {getErrorMessage} from '../services/serviceUtils';
import {
  create as createUpdate,
  list as listUpdates,
  remove as removeUpdate,
} from '../services/updates';
import {
  MILESTONE_STATUSES,
  milestoneFormSchema,
  timelineUpdateFormSchema,
  type MilestoneFormParsed,
  type MilestoneFormValues,
  type MilestoneRecord,
  type MilestoneStatus,
  type ProjectFormParsed,
  type ProjectStatus,
  type TimelineUpdateFormParsed,
  type TimelineUpdateFormValues,
} from '../types/portal';
import {formatDateDisplay, formatDateTime} from '../utils/format';
import {compressImageToDataUrl} from '../utils/imageCompress';
import {createNotification} from '../utils/notifications';

type DetailTab = 'overview' | 'timeline' | 'files' | 'messages' | 'invoices';

const TABS: {id: DetailTab; label: string; icon: typeof LayoutList}[] = [
  {id: 'overview', label: 'Overview', icon: LayoutList},
  {id: 'timeline', label: 'Timeline', icon: CalendarClock},
  {id: 'files', label: 'Files', icon: FolderOpen},
  {id: 'messages', label: 'Messages', icon: MessageSquare},
  {id: 'invoices', label: 'Invoices', icon: FileText},
];

const STATUS_TEXT_COLORS: Record<ProjectStatus, string> = {
  Planning: 'text-amber-700 dark:text-amber-400',
  Design: 'text-amber-700 dark:text-amber-400',
  Development: 'text-indigo-700 dark:text-indigo-400',
  Review: 'text-indigo-700 dark:text-indigo-400',
  Delivered: 'text-emerald-700 dark:text-emerald-400',
};

const MILESTONE_BADGE_CLASSES: Record<MilestoneStatus, string> = {
  Pending:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  'In Review':
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Approved:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
  'Changes Requested':
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60',
};

export function AdminProjectDetailPage() {
  const {projectId} = useParams<{projectId: string}>();
  const {user} = useAuth();
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: DetailTab =
    tabParam === 'timeline' ||
    tabParam === 'files' ||
    tabParam === 'messages' ||
    tabParam === 'invoices'
      ? tabParam
      : 'overview';
  const setActiveTab = (tab: DetailTab) => {
    setSearchParams(tab === 'overview' ? {} : {tab}, {replace: true});
  };
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Milestone modal state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);

  // Timeline attachments state
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isCompressingImages, setIsCompressingImages] = useState(false);

  const milestoneForm = useForm<MilestoneFormValues, unknown, MilestoneFormParsed>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'Pending',
    },
  });

  const updateForm = useForm<TimelineUpdateFormValues, unknown, TimelineUpdateFormParsed>({
    resolver: zodResolver(timelineUpdateFormSchema),
    defaultValues: {
      message: '',
    },
  });

  const {
    data: project = null,
    isLoading: loading,
    error: projectError,
  } = useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: () => getProjectById(projectId ?? ''),
    enabled: Boolean(projectId),
  });

  const {data: clients = []} = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => listClients(),
    enabled: Boolean(projectId),
  });

  const {data: milestones = [], isLoading: loadingMilestones} = useQuery({
    queryKey: queryKeys.milestones.list(projectId),
    queryFn: () => listMilestones({projectId}),
    enabled: Boolean(projectId),
  });

  const {data: updates = [], isLoading: loadingUpdates} = useQuery({
    queryKey: queryKeys.updates.list({projectId}),
    queryFn: () => listUpdates({projectId}),
    enabled: Boolean(projectId),
  });

  const {data: unreadMessages = 0} = useQuery({
    queryKey: queryKeys.messages.unreadCount({
      userId: user?.id ?? '',
      projectId,
    }),
    queryFn: () =>
      countUnread({
        viewerId: user?.id ?? '',
        viewerRole: 'admin',
        projectId,
      }),
    enabled: Boolean(projectId && user?.id),
  });

  // Realtime subscription ONLY on messages / message_reads
  useEffect(() => {
    if (!projectId || !user?.id) return;
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
    }, projectId);
  }, [projectId, user?.id, queryClient]);

  useEffect(() => {
    if (!isMilestoneModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMilestoneModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMilestoneModalOpen]);

  const handleSaveProject = async (values: ProjectFormParsed) => {
    if (!projectId || !user || user.role !== 'admin') return;
    setActionError(null);
    const actorName = user.name || 'Stack Dev';
    const actorUid = user.id;
    const updateMessage = `Updated to ${values.status} stage (${values.progress}% complete).`;
    try {
      await updateProject(projectId, values);
      await createUpdate({
        projectId,
        authorId: actorUid,
        message: updateMessage,
        attachments: [],
      });
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(projectId)}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix}),
      ]);
      await createNotification({
        recipientRole: 'client',
        clientId: values.clientId,
        projectId,
        type: 'update',
        title: `Project update: ${values.title}`,
        body: updateMessage,
        link: `/projects/${projectId}?tab=timeline`,
        actorUid,
        actorName,
      });
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update project.'));
      throw err;
    }
  };

  const handleAddMilestone = async (values: MilestoneFormParsed) => {
    if (!project || !user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await createMilestone({
        projectId: project.id,
        title: values.title,
        description: values.description,
        dueDate: values.dueDate,
        status: values.status,
      });
      await queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix});
      if (values.status === 'In Review') {
        await createNotification({
          recipientRole: 'client',
          clientId: project.clientId,
          projectId: project.id,
          type: 'milestone',
          title: `Milestone ready for review: ${values.title}`,
          body: `${project.title} has a milestone awaiting your approval.`,
          link: `/projects/${project.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
      milestoneForm.reset({
        title: '',
        description: '',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'Pending',
      });
      setIsMilestoneModalOpen(false);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to add milestone.'));
    }
  };

  const handleMilestoneStatusChange = async (
    milestone: MilestoneRecord,
    nextStatus: MilestoneStatus,
  ) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    setUpdatingMilestoneId(milestone.id);
    const shouldResetReviewMeta = nextStatus === 'Pending' || nextStatus === 'In Review';
    try {
      await updateMilestone(milestone.id, {
        status: nextStatus,
        resetReviewMeta: shouldResetReviewMeta,
      });
      await queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix});
      if (nextStatus === 'In Review' && milestone.status !== 'In Review' && project) {
        await createNotification({
          recipientRole: 'client',
          clientId: project.clientId,
          projectId: project.id,
          type: 'milestone',
          title: `Milestone ready for review: ${milestone.title}`,
          body: `${project.title} has a milestone awaiting your approval.`,
          link: `/projects/${project.id}`,
          actorUid: user.id,
          actorName: user.name,
        });
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update milestone status.'));
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await removeMilestone(milestoneId);
      await queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to delete milestone.'));
    }
  };

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = 3 - attachments.length;
    if (remainingSlots <= 0) {
      setAttachmentError('You can attach up to 3 images per update.');
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setAttachmentError(`Only ${remainingSlots} more image(s) allowed (max 3 per update).`);
    }

    setIsCompressingImages(true);
    try {
      const encoded = await Promise.all(toProcess.map((f) => compressImageToDataUrl(f)));
      setAttachments((prev) => [...prev, ...encoded].slice(0, 3));
    } catch (err) {
      setAttachmentError(
        err instanceof Error ? err.message : 'Unable to attach one of the selected images.',
      );
    } finally {
      setIsCompressingImages(false);
    }
  };

  const handlePostUpdate = async (values: TimelineUpdateFormParsed) => {
    if (!project || !user || user.role !== 'admin') return;
    setAttachmentError(null);
    setActionError(null);
    try {
      await createUpdate({
        projectId: project.id,
        authorId: user.id,
        message: values.message,
        attachments,
      });
      await queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix});
      await createNotification({
        recipientRole: 'client',
        clientId: project.clientId,
        projectId: project.id,
        type: 'update',
        title: `New timeline update: ${project.title}`,
        body: values.message,
        link: `/projects/${project.id}?tab=timeline`,
        actorUid: user.id,
        actorName: user.name,
      });
      updateForm.reset({message: ''});
      setAttachments([]);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to post update.'));
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!user || user.role !== 'admin') return;
    setActionError(null);
    try {
      await removeUpdate(updateId);
      await queryClient.invalidateQueries({queryKey: queryKeys.updates.prefix});
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to delete update.'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Project not found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {projectError
            ? getErrorMessage(projectError, 'This project may have been deleted or does not exist.')
            : 'This project may have been deleted or does not exist.'}
        </p>
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const revisionsExceeded = project.revisionsUsed > project.revisionsAllowed;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Projects</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {project.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>{project.clientName}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{project.package} package</span>
            <span aria-hidden="true">·</span>
            <span className={`font-medium ${STATUS_TEXT_COLORS[project.status]}`}>
              {project.status}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
          <span>Edit Project</span>
        </button>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-4"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-medium underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Revisions Exceeded Warning */}
      {revisionsExceeded && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-5 py-4 flex items-start gap-3 text-sm text-red-800 dark:text-red-300"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" aria-hidden="true" />
          <div>
            <p className="font-semibold">Revision limit exceeded</p>
            <p className="mt-0.5 text-xs sm:text-sm text-red-700 dark:text-red-300/90 tabular-nums">
              {project.revisionsUsed} revisions have been used out of {project.revisionsAllowed} allowed for this package.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <nav aria-label="Project sections" className="flex items-center gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.id === 'messages' && unreadMessages > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold tabular-nums">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Progress & Key Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Overall Progress
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {project.progress}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    project.status === 'Delivered'
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : 'bg-indigo-600 dark:bg-indigo-500'
                  }`}
                  style={{width: `${project.progress}%`}}
                />
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Client</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {project.clientName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Package</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {project.package}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</dt>
                <dd className={`mt-1 text-sm font-semibold ${STATUS_TEXT_COLORS[project.status]}`}>
                  {project.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Start Date
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatDateDisplay(project.startDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Due Date</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatDateDisplay(project.dueDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Revisions
                </dt>
                <dd
                  className={`mt-1 text-sm font-semibold tabular-nums ${
                    revisionsExceeded
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {project.revisionsUsed} used of {project.revisionsAllowed} allowed
                </dd>
              </div>
            </dl>
          </div>

          {/* Milestones Management */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Milestones
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set a milestone to &ldquo;In Review&rdquo; when it is ready for client approval.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Milestone</span>
              </button>
            </div>

            {loadingMilestones ? (
              <div className="p-6 space-y-3 animate-pulse">
                {[1, 2].map((row) => (
                  <div key={row} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : milestones.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle2
                  className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2.5"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  No milestones added yet
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add milestones to break down deliverables and let the client approve or request revisions.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {milestones.map((m) => (
                  <li key={m.id} className="p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {m.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${MILESTONE_BADGE_CLASSES[m.status]}`}
                          >
                            {m.status}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                            {m.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          Due {formatDateDisplay(m.dueDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          aria-label={`Status for ${m.title}`}
                          value={m.status}
                          disabled={updatingMilestoneId === m.id}
                          onChange={(e) =>
                            handleMilestoneStatusChange(m, e.target.value as MilestoneStatus)
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
                        >
                          {MILESTONE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(m.id)}
                          aria-label={`Delete ${m.title}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {(m.actionByName || m.reviewComment) && (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 text-xs space-y-1">
                        {m.actionByName && (
                          <p className="text-slate-600 dark:text-slate-400">
                            <span className="font-medium text-slate-900 dark:text-slate-200">
                              {m.actionByName}
                            </span>{' '}
                            marked as <span className="font-medium">{m.status}</span>
                            {m.actionAt ? ` on ${formatDateTime(m.actionAt)}` : ''}
                          </p>
                        )}
                        {m.reviewComment && (
                          <p className="text-red-700 dark:text-red-300">
                            Requested changes: &ldquo;{m.reviewComment}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Project Description
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
              {project.description || 'No description provided for this project yet.'}
            </p>
          </div>
        </div>
      ) : activeTab === 'timeline' ? (
        <div className="space-y-6">
          {/* Post Update Composer */}
          <form
            onSubmit={updateForm.handleSubmit(handlePostUpdate)}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4"
            noValidate
          >
            <div>
              <label
                htmlFor="timeline-message"
                className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5"
              >
                Post Project Update
              </label>
              <textarea
                id="timeline-message"
                rows={3}
                {...updateForm.register('message')}
                placeholder="Share progress, completed screens, staging links, or sprint notes with the client..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
              />
              {updateForm.formState.errors.message && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {updateForm.formState.errors.message.message}
                </p>
              )}
            </div>

            {attachmentError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {attachmentError}
              </p>
            )}

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {attachments.map((src, idx) => (
                  <div
                    key={`preview-${idx}`}
                    className="relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950"
                  >
                    <img
                      src={src}
                      alt={`Attachment preview ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))
                      }
                      aria-label={`Remove attachment ${idx + 1}`}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/75 text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <ImagePlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <span>
                  {isCompressingImages
                    ? 'Processing images...'
                    : `Attach images (${attachments.length}/3)`}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  disabled={isCompressingImages || attachments.length >= 3}
                  onChange={handleImageSelect}
                  className="sr-only"
                />
              </label>

              <button
                type="submit"
                disabled={updateForm.formState.isSubmitting || isCompressingImages}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{updateForm.formState.isSubmitting ? 'Posting...' : 'Post Update'}</span>
              </button>
            </div>
          </form>

          {/* Updates Feed */}
          <TimelineFeed
            updates={updates}
            loading={loadingUpdates}
            onDeleteUpdate={handleDeleteUpdate}
          />
        </div>
      ) : activeTab === 'files' && user ? (
        <ProjectFilesTab project={project} user={user} />
      ) : activeTab === 'messages' && user ? (
        <ProjectMessagesTab project={project} user={user} />
      ) : activeTab === 'invoices' && user ? (
        <ProjectInvoicesTab project={project} user={user} clients={clients} />
      ) : null}

      <ProjectFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveProject}
        clients={clients}
        initialProject={project}
      />

      {/* Add Milestone Modal */}
      {isMilestoneModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="milestone-modal-title"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3
                id="milestone-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Add Milestone
              </h3>
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                aria-label="Close modal"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={milestoneForm.handleSubmit(handleAddMilestone)}
              className="p-6 space-y-4"
              noValidate
            >
              <div>
                <label
                  htmlFor="ms-title"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Milestone Title
                </label>
                <input
                  id="ms-title"
                  type="text"
                  {...milestoneForm.register('title')}
                  placeholder="e.g. UI/UX Figma Wireframes"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                {milestoneForm.formState.errors.title && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {milestoneForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="ms-desc"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="ms-desc"
                  rows={3}
                  {...milestoneForm.register('description')}
                  placeholder="Deliverables included in this checkpoint..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
                />
                {milestoneForm.formState.errors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {milestoneForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ms-due"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Due Date
                  </label>
                  <input
                    id="ms-due"
                    type="date"
                    {...milestoneForm.register('dueDate')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                  {milestoneForm.formState.errors.dueDate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {milestoneForm.formState.errors.dueDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="ms-status"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Initial Status
                  </label>
                  <select
                    id="ms-status"
                    {...milestoneForm.register('status')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  >
                    {MILESTONE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={milestoneForm.formState.isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  {milestoneForm.formState.isSubmitting ? 'Adding...' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
