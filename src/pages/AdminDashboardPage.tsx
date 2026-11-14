import {useQuery} from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Receipt,
} from 'lucide-react';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {useLanguage} from '../context/LanguageContext';
import {queryKeys} from '../lib/queryKeys';
import {list as listClients} from '../services/clients';
import {list as listInvoices} from '../services/invoices';
import {list as listProjects} from '../services/projects';
import {getErrorMessage} from '../services/serviceUtils';
import type {ProjectStatus} from '../types/portal';
import {formatBDT, formatDateDisplay} from '../utils/format';
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

function getLocalISODate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AdminDashboardPage() {
  const {t} = useLanguage();

  const {
    data: projects = [],
    isLoading: loadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => listProjects(),
  });

  const {
    data: clients = [],
    isLoading: loadingClients,
    error: clientsError,
  } = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => listClients(),
  });

  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    error: invoicesError,
  } = useQuery({
    queryKey: queryKeys.invoices.list(),
    queryFn: () => listInvoices({includeDrafts: true}),
  });

  const projectMetrics = useMemo(() => {
    const active = projects.filter((p) => p.status !== 'Delivered');
    const todayStr = getLocalISODate(0);
    const next7Str = getLocalISODate(7);

    const dueNext7Days = active
      .filter((p) => Boolean(p.dueDate) && p.dueDate >= todayStr && p.dueDate <= next7Str)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
      activeCount: active.length,
      totalCount: projects.length,
      dueNext7Days,
    };
  }, [projects]);

  const invoiceMetrics = useMemo(() => {
    const unpaid = invoices.filter((inv) => {
      const effective = getEffectiveInvoiceStatus(inv);
      return effective === 'Sent' || effective === 'Overdue';
    });
    const overdueCount = unpaid.filter((inv) => getEffectiveInvoiceStatus(inv) === 'Overdue').length;
    const totalUnpaidAmount = unpaid.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      unpaidCount: unpaid.length,
      overdueCount,
      totalUnpaidAmount,
    };
  }, [invoices]);

  const activeLoginCount = useMemo(
    () => clients.filter((c) => c.hasLoginAccount).length,
    [clients],
  );

  const dashboardError = projectsError || clientsError || invoicesError;

  return (
    <section className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            {t.dashboard.adminTitle}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t.dashboard.adminSubtitle}
          </p>
        </div>

        <Link
          to="/admin/projects"
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
          {getErrorMessage(dashboardError, 'Unable to load dashboard overview.')}
        </div>
      )}

      {/* Unified KPI Metrics Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {/* Active Projects */}
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
                {t.dashboard.activeProjects}
              </span>
              <FolderKanban
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
                aria-hidden="true"
              />
            </div>

            <div className="font-mono text-3xl sm:text-[34px] leading-none font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {projectMetrics.activeCount}
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="tabular-nums">
                {projectMetrics.totalCount} total{' '}
                {projectMetrics.totalCount === 1 ? 'project' : 'projects'}
              </span>
              <Link
                to="/admin/projects"
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
              >
                <span>{t.dashboard.viewAllProjects}</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {/* Clients */}
        {loadingClients ? (
          <div className="p-6 min-h-[148px] animate-pulse flex flex-col justify-between">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="p-6 min-h-[148px] flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                {t.dashboard.totalClients}
              </span>
              <Building2
                className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0"
                aria-hidden="true"
              />
            </div>

            <div className="font-mono text-3xl sm:text-[34px] leading-none font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {clients.length}
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="tabular-nums">{activeLoginCount} portal logins active</span>
              <Link
                to="/admin/clients"
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
              >
                <span>{t.dashboard.viewAllClients}</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {/* Unpaid Invoices */}
        {loadingInvoices ? (
          <div className="p-6 min-h-[148px] animate-pulse flex flex-col justify-between">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-36 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3.5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="p-6 min-h-[148px] flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                {t.dashboard.unpaidInvoices}
              </span>
              <Receipt
                className={`w-4 h-4 shrink-0 ${
                  invoiceMetrics.overdueCount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : invoiceMetrics.unpaidCount > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                }`}
                aria-hidden="true"
              />
            </div>

            <div
              className={`font-mono text-2xl sm:text-[32px] leading-none font-semibold tracking-tight tabular-nums ${
                invoiceMetrics.overdueCount > 0
                  ? 'text-red-600 dark:text-red-400'
                  : invoiceMetrics.unpaidCount > 0
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatBDT(invoiceMetrics.totalUnpaidAmount)}
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="tabular-nums">
                {invoiceMetrics.unpaidCount} unpaid
                {invoiceMetrics.overdueCount > 0 && (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {' '}
                    · {invoiceMetrics.overdueCount} overdue
                  </span>
                )}
              </span>
              <Link
                to="/invoices"
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
              >
                <span>{t.dashboard.viewAllInvoices}</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Deadlines Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {t.dashboard.dueNext7Days}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {t.dashboard.dueNext7DaysHint}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
            <CalendarClock
              className="w-4 h-4 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {projectMetrics.dueNext7Days.length}
            </span>
            <span>due within 7 days</span>
          </div>
        </div>

        {loadingProjects ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 animate-pulse">
            {[1, 2, 3].map((row) => (
              <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : projectMetrics.dueNext7Days.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200/70 dark:border-emerald-900/60">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.dashboard.noUpcomingDeadlines}
            </p>
            <Link
              to="/admin/projects"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>{t.dashboard.viewAllProjects}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th scope="col" className="py-3 pl-6 pr-4 font-medium">
                    Project &amp; Client
                  </th>
                  <th scope="col" className="py-3 px-4 font-medium whitespace-nowrap">
                    Stage
                  </th>
                  <th scope="col" className="py-3 px-4 font-medium whitespace-nowrap">
                    Progress
                  </th>
                  <th scope="col" className="py-3 px-4 font-medium text-right whitespace-nowrap">
                    Due Date
                  </th>
                  <th scope="col" className="py-3 pl-4 pr-6 font-medium text-right whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {projectMetrics.dueNext7Days.map((project) => (
                  <tr
                    key={project.id}
                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/35 transition-colors duration-150"
                  >
                    <td className="py-3.5 pl-6 pr-4 min-w-[220px]">
                      <Link
                        to={`/admin/projects/${project.id}`}
                        className="block focus-visible:outline-none focus-visible:underline"
                      >
                        <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-md">
                          {project.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="truncate max-w-[200px]">{project.clientName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{project.package}</span>
                        </div>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-2 text-xs font-semibold ${STATUS_TEXT_CLASSES[project.status]}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-xs shrink-0 ${STATUS_DOT_CLASSES[project.status]}`}
                        />
                        <span>{project.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[150px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden min-w-[72px]">
                          <div
                            className="h-full rounded-sm bg-indigo-600 dark:bg-indigo-500"
                            style={{width: `${project.progress}%`}}
                          />
                        </div>
                        <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums w-9 text-right">
                          {project.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                        {formatDateDisplay(project.dueDate)}
                      </span>
                    </td>

                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/projects/${project.id}`}
                        className="inline-flex items-center justify-end gap-1 min-h-[36px] px-2.5 py-1.5 rounded-md text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      >
                        <span>{t.actions.open}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
