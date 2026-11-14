import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  FolderOpen,
  LayoutList,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ProjectFilesTab} from '../components/ProjectFilesTab';
import {ProjectInvoicesTab} from '../components/ProjectInvoicesTab';
import {ProjectMessagesTab} from '../components/ProjectMessagesTab';
import {TimelineFeed} from '../components/TimelineFeed';
import {useAuth} from '../context/AuthContext';
import {queryKeys} from '../lib/queryKeys';
import {countUnread, subscribeToMessages} from '../services/messages';
import {
  list as listMilestones,
  submitClientReview,
} from '../services/milestones';
import {getById as getProjectById} from '../services/projects';
import {getErrorMessage} from '../services/serviceUtils';
import {list as listUpdates} from '../services/updates';
import {
  PROJECT_STATUSES,
  type MilestoneRecord,
  type MilestoneStatus,
  type ProjectStatus,
} from '../types/portal';
import {formatDateDisplay, formatDateTime} from '../utils/format';
import {createNotification} from '../utils/notifications';

type DetailTab = 'overview' | 'timeline' | 'files' | 'messages' | 'invoices';

const TABS: {id: DetailTab; label: string; icon: typeof LayoutList}[] = [
  {id: 'overview', label: 'Overview', icon: LayoutList},
  {id: 'timeline', label: 'Timeline', icon: CalendarClock},
  {id: 'files', label: 'Files', icon: FolderOpen},
  {id: 'messages', label: 'Messages', icon: MessageSquare},
  {id: 'invoices', label: 'Invoices', icon: FileText},
];

const STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  Planning:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Design:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60',
  Development:
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900/60',
  Review:
    'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900/60',
  Delivered:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60',
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

export function ClientProjectDetailPage() {
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

  // Client Milestone Review state
  const [requestingChangesId, setRequestingChangesId] = useState<string | null>(null);
  const [changeComment, setChangeComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingActionId, setSubmittingActionId] = useState<string | null>(null);

  const clientId = user?.clientId ?? '';

  const {
    data: rawProject = null,
    isLoading: loadingProject,
    error: projectError,
  } = useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: () => getProjectById(projectId ?? ''),
    enabled: Boolean(projectId && clientId),
  });

  const accessDenied = Boolean(rawProject && rawProject.clientId !== clientId);
  const project = rawProject && !accessDenied ? rawProject : null;

  const {data: milestones = [], isLoading: loadingMilestones} = useQuery({
    queryKey: queryKeys.milestones.list(projectId),
    queryFn: () => listMilestones({projectId}),
    enabled: Boolean(projectId && project),
  });

  const {data: updates = [], isLoading: loadingUpdates} = useQuery({
    queryKey: queryKeys.updates.list({projectId}),
    queryFn: () => listUpdates({projectId}),
    enabled: Boolean(projectId && project),
  });

  const {data: unreadMessages = 0} = useQuery({
    queryKey: queryKeys.messages.unreadCount({
      userId: user?.id ?? '',
      clientId,
      projectId,
    }),
    queryFn: () =>
      countUnread({
        viewerId: user?.id ?? '',
        viewerRole: 'client',
        clientId,
        projectId,
      }),
    enabled: Boolean(projectId && project && user?.id),
  });

  // Realtime subscription ONLY on messages / message_reads
  useEffect(() => {
    if (!projectId || !user?.id) return;
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({queryKey: queryKeys.messages.unreadPrefix});
    }, projectId);
  }, [projectId, user?.id, queryClient]);

  const stageMilestones = useMemo(() => {
    if (!project) return [];
    const currentIndex = PROJECT_STATUSES.indexOf(project.status);
    return PROJECT_STATUSES.map((stage, idx) => {
      let state: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
      if (project.status === 'Delivered' || idx < currentIndex) {
        state = 'Completed';
      } else if (idx === currentIndex) {
        state = 'In Progress';
      }
      return {stage, state};
    });
  }, [project]);

  const handleApproveMilestone = async (milestone: MilestoneRecord) => {
    if (!user || !project) return;
    setActionError(null);
    setSubmittingActionId(milestone.id);
    try {
      await submitClientReview(milestone.id, 'Approved');
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(project.id)}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
      ]);
      await createNotification({
        recipientRole: 'admin',
        clientId: project.clientId,
        projectId: project.id,
        type: 'milestone',
        title: `Milestone approved: ${milestone.title}`,
        body: `${user.name} approved "${milestone.title}" on ${project.title}.`,
        link: `/admin/projects/${project.id}`,
        actorUid: user.id,
        actorName: user.name,
      });
      if (requestingChangesId === milestone.id) {
        setRequestingChangesId(null);
        setChangeComment('');
        setCommentError(null);
      }
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to approve milestone.'));
    } finally {
      setSubmittingActionId(null);
    }
  };

  const handleSubmitChangesRequested = async (milestone: MilestoneRecord) => {
    if (!user || !project) return;
    const trimmed = changeComment.trim();
    if (!trimmed) {
      setCommentError('Please describe the changes you would like before submitting.');
      return;
    }

    setCommentError(null);
    setActionError(null);
    setSubmittingActionId(milestone.id);

    try {
      await submitClientReview(milestone.id, 'Changes Requested', trimmed);
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.milestones.prefix}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.detail(project.id)}),
        queryClient.invalidateQueries({queryKey: queryKeys.projects.prefix}),
      ]);

      await createNotification({
        recipientRole: 'admin',
        clientId: project.clientId,
        projectId: project.id,
        type: 'milestone',
        title: `Changes requested: ${milestone.title}`,
        body: `${user.name} requested changes on ${project.title}: "${trimmed}"`,
        link: `/admin/projects/${project.id}`,
        actorUid: user.id,
        actorName: user.name,
      });

      setRequestingChangesId(null);
      setChangeComment('');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to submit revision request.'));
    } finally {
      setSubmittingActionId(null);
    }
  };

  if (loadingProject) {
    return (
      <section className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-72 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      </section>
    );
  }

  if (!project || accessDenied) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Project unavailable
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {projectError
            ? getErrorMessage(
                projectError,
                'We could not find this project in your workspace, or you do not have permission to view it.',
              )
            : 'We could not find this project in your workspace, or you do not have permission to view it.'}
        </p>
        <Link
          to="/projects"
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
      {/* Header (Read-only) */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Projects</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {project.title}
          </h2>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${STATUS_BADGE_CLASSES[project.status]}`}
          >
            {project.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 capitalize">
          {project.package} package · Due {formatDateDisplay(project.dueDate)}
        </p>
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
          <AlertTriangle
            className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Included revisions exceeded</p>
            <p className="mt-0.5 text-xs sm:text-sm text-red-700 dark:text-red-300/90 tabular-nums">
              {project.revisionsUsed} of {project.revisionsAllowed} included revisions have been used. Additional revision rounds may incur extra charges.
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

      {/* Tab Body */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Status, Progress, Dates & Package */}
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

            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</dt>
                <dd className="mt-1.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE_CLASSES[project.status]}`}
                  >
                    {project.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Package</dt>
                <dd className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {project.package}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Start Date
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatDateDisplay(project.startDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">Due Date</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatDateDisplay(project.dueDate)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Milestones */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Milestones
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review deliverable checkpoints and approve or request changes.
                </p>
              </div>
              <span
                className={`text-xs font-medium tabular-nums ${
                  revisionsExceeded
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Revisions: {project.revisionsUsed}/{project.revisionsAllowed} used
              </span>
            </div>

            {/* Delivery Stage Progression */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {stageMilestones.map(({stage, state}) => (
                <div
                  key={stage}
                  className={`rounded-xl border p-3 flex flex-col gap-2 ${
                    state === 'Completed'
                      ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30'
                      : state === 'In Progress'
                        ? 'border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/60 dark:bg-indigo-950/40'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {state === 'Completed' ? (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : state === 'In Progress' ? (
                      <Clock
                        className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className="w-4 h-4 text-slate-400 dark:text-slate-600"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {state}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {stage}
                  </span>
                </div>
              ))}
            </div>

            {/* Project Milestones */}
            {loadingMilestones ? (
              <div className="space-y-3 animate-pulse pt-2">
                <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            ) : milestones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No specific milestones have been scheduled yet. Your Stack Dev project manager will post review checkpoints here.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 pt-2">
                {milestones.map((m) => {
                  const isInReview = m.status === 'In Review';
                  const isRequesting = requestingChangesId === m.id;
                  const isBusy = submittingActionId === m.id;

                  return (
                    <li key={m.id} className="py-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {m.title}
                            </p>
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
                          {m.dueDate && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              Due {formatDateDisplay(m.dueDate)}
                            </p>
                          )}
                        </div>

                        {isInReview && (
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApproveMilestone(m)}
                              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
                            >
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{isBusy && !isRequesting ? 'Approving...' : 'Approve'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setRequestingChangesId(isRequesting ? null : m.id);
                                setChangeComment('');
                                setCommentError(null);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors whitespace-nowrap"
                            >
                              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Request Changes</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Request Changes Comment Box */}
                      {isInReview && isRequesting && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-4 space-y-3">
                          <label
                            htmlFor={`change-comment-${m.id}`}
                            className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
                          >
                            What changes are needed? (Required)
                          </label>
                          <textarea
                            id={`change-comment-${m.id}`}
                            rows={3}
                            value={changeComment}
                            onChange={(e) => setChangeComment(e.target.value)}
                            placeholder="Describe the adjustments you would like the team to make..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 resize-y"
                          />
                          {commentError && (
                            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                              {commentError}
                            </p>
                          )}
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setRequestingChangesId(null);
                                setChangeComment('');
                                setCommentError(null);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleSubmitChangesRequested(m)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                            >
                              {isBusy ? 'Submitting...' : 'Submit Revision Request'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Audit Info */}
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
                              Comment: &ldquo;{m.reviewComment}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Scope &amp; Description
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
              {project.description || 'No additional project description has been added yet.'}
            </p>
          </div>
        </div>
      ) : activeTab === 'timeline' ? (
        <TimelineFeed
          updates={updates}
          loading={loadingUpdates}
          emptyMessage={`No updates have been posted for ${project.title} yet. Check back soon for progress notes and screenshots.`}
        />
      ) : activeTab === 'files' && user ? (
        <ProjectFilesTab project={project} user={user} />
      ) : activeTab === 'messages' && user ? (
        <ProjectMessagesTab project={project} user={user} />
      ) : activeTab === 'invoices' && user ? (
        <ProjectInvoicesTab project={project} user={user} />
      ) : null}
    </section>
  );
}
