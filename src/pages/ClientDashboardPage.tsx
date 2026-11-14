import {useQuery} from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Receipt,
} from 'lucide-react';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {queryKeys} from '../lib/queryKeys';
import {list as listInvoices} from '../services/invoices';
import {list as listProjects} from '../services/projects';
import {getErrorMessage} from '../services/serviceUtils';
import {list as listUpdates} from '../services/updates';
import type {ProjectStatus} from '../types/portal';
import {formatBDT, formatDateDisplay, formatTimestamp} from '../utils/format';
import {getEffectiveInvoiceStatus} from '../utils/invoices';

const STATUS_TEXT_CLASSES: Record<ProjectStatus, string> = {
  Planning: 'text-amber-700 dark:text-amber-400',
  Design: 'text-amber-700 dark:text-amber-400',
  Development: 'text-indigo-700 dark:text-indigo-400',
  Review: 'text-indigo-700 dark:text-indigo-400',
  Delivered: 'text-emerald-700 dark:text-emerald-400',
};

const STATUS_DOT_CLASSES: Record<ProjectStatus, string> = {
  Planning: 'bg-amber-500',
  Design: 'bg-amber-500',
  Development: 'bg-indigo-600 dark:bg-indigo-400',
  Review: 'bg-indigo-600 dark:bg-indigo-400',
  Delivered: 'bg-emerald-600 dark:bg-emerald-400',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function ClientDashboardPage() {
  const {user} = useAuth();
  const {t} = useLanguage();
  const clientId = user?.clientId ?? '';

  const {
    data: projects = [],
    isLoading: loadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: queryKeys.projects.list(clientId),
    queryFn: () => listProjects({clientId}),
    enabled: Boolean(clientId),
  });

  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    error: invoicesError,
  } = useQuery({
    queryKey: queryKeys.invoices.list({clientId}),
    queryFn: () => listInvoices({clientId, includeDrafts: false}),
    enabled: Boolean(clientId),
  });

  const {
    data: updates = [],
    isLoading: loadingUpdates,
    error: updatesError,
  } = useQuery({
    queryKey: queryKeys.updates.list({clientId, limit: 5}),
    queryFn: () => listUpdates({clientId, limit: 5}),
    enabled: Boolean(clientId),
  });

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'Delivered'),
    [projects],
  );

  const invoiceSummary = useMemo(() => {
    const unpaid = invoices.filter((inv) => {
      const effective = getEffectiveInvoiceStatus(inv);
      return effective === 'Sent' || effective === 'Overdue';
    });
    const overdue = unpaid.filter((inv) => getEffectiveInvoiceStatus(inv) === 'Overdue');
    const totalUnpaidAmount = unpaid.reduce((sum, inv) => sum + inv.amount, 0);
    return {
      totalUnpaidAmount,
      unpaidCount: unpaid.length,
      overdueCount: overdue.length,
    };
  }, [invoices]);

  const dashboardError = projectsError || invoicesError || updatesError;

  return (
    <section className="space-y-8">
      {/* Greeting Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            {getGreeting()}, {user?.name ?? 'Client'}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Here is a live summary of your active projects, billing, and latest updates from Stack Dev.
          </p>
        </div>

        <Link
          to="/projects"
          className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <span>{t.dashboard.viewAllProjects}</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </Link>
      </header>

      {dashboardError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {getErrorMessage(dashboardError, 'Unable to load workspace overview.')}
        </div>
      )}

      {/* Top Unified Summary Strip: Unpaid Invoices + Active Project Count */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {loadingInvoices ? (
          <div className="md:col-span-2 p-6 min-h-[148px] animate-pulse flex flex-col justify-between">
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-56 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="md:col-span-2 p-6 min-h-[148px] flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                Total Unpaid Invoices (BDT)
              </span>
              <Receipt
                className={`w-4 h-4 shrink-0 ${
                  invoiceSummary.overdueCount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : invoiceSummary.unpaidCount > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                }`}
                aria-hidden="true"
              />
            </div>

            <div
              className={`font-mono text-3xl sm:text-[34px] leading-none font-semibold tracking-tight tabular-nums ${
                invoiceSummary.overdueCount > 0
                  ? 'text-red-600 dark:text-red-400'
                  : invoiceSummary.unpaidCount > 0
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatBDT(invoiceSummary.totalUnpaidAmount)}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              {invoiceSummary.unpaidCount === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>All invoices are paid — no balance due.</span>
                </span>
              ) : (
                <span className="tabular-nums">
                  {invoiceSummary.unpaidCount} unpaid{' '}
                  {invoiceSummary.unpaidCount === 1 ? 'invoice' : 'invoices'}
                  {invoiceSummary.overdueCount > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      {' '}
                      · {invoiceSummary.overdueCount} overdue
                    </span>
                  )}
                </span>
              )}
              <Link
                to="/invoices"
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
              >
                <span>Go to Invoices</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {loadingProjects ? (
          <div className="p-6 min-h-[148px] animate-pulse flex flex-col justify-between">
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="p-6 min-h-[148px] flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                Active Projects
              </span>
              <FolderKanban
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
                aria-hidden="true"
              />
            </div>

            <div className="font-mono text-3xl sm:text-[34px] leading-none font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {activeProjects.length}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {projects.length} total {projects.length === 1 ? 'engagement' : 'engagements'} with Stack Dev
            </p>
          </div>
        )}
      </div>

      {/* Active Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Active Projects
          </h3>
          {!loadingProjects && (
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {activeProjects.length} active
            </span>
          )}
        </div>

        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-pulse"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-5 w-52 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-1.5 w-full rounded-sm bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : activeProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6 py-12 text-center">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-200/70 dark:border-indigo-900/60">
              <FolderKanban className="w-5 h-5" aria-hidden="true" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No active projects right now
            </h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {projects.length > 0
                ? 'All of your projects have been delivered! You can review completed engagements on the Projects page.'
                : 'When your Stack Dev team kicks off a website or Flutter project, it will appear here with live progress.'}
            </p>
            {projects.length > 0 && (
              <Link
                to="/projects"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>View delivered projects</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <div className="space-y-2">
                  {/* Unboxed quiet metadata kicker */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap ${STATUS_TEXT_CLASSES[project.status]}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-xs shrink-0 ${STATUS_DOT_CLASSES[project.status]}`}
                        />
                        <span>{project.status}</span>
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                        ·
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 capitalize truncate">
                        {project.package} package
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Due {formatDateDisplay(project.dueDate)}</span>
                    </span>
                  </div>

                  <h4 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {project.title}
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-indigo-600 dark:bg-indigo-500 transition-all duration-200"
                      style={{width: `${project.progress}%`}}
                    />
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Open workspace
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 5 Most Recent Updates */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Recent Updates
          </h3>
          {!loadingUpdates && updates.length > 0 && (
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Latest {updates.length}
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loadingUpdates ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 animate-pulse">
              {[1, 2, 3].map((row) => (
                <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-72 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200/70 dark:border-slate-700/70">
                <Bell className="w-5 h-5" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No recent updates yet
              </h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                As our engineering team ships milestones or updates project status, your 5 latest updates will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {updates.map((update) => (
                <li
                  key={update.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/35 transition-colors duration-150"
                >
                  <div className="min-w-0 max-w-3xl">
                    <Link
                      to={`/projects/${update.projectId}`}
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {update.projectTitle}
                    </Link>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {update.message}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                    {formatTimestamp(update.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
