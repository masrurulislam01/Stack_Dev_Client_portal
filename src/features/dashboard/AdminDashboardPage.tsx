import {ArrowRight} from 'lucide-react';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {AdminKpiStrip} from '@/features/dashboard/AdminKpiStrip';
import {UpcomingDeadlinesTable} from '@/features/dashboard/UpcomingDeadlinesTable';
import {useClients, useInvoices, useLanguage, useProjects} from '@/hooks';
import {getErrorMessage} from '@/services/serviceUtils';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

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

  const {data: projects = [], isLoading: loadingProjects, error: projectsError} = useProjects();
  const {data: clients = [], isLoading: loadingClients, error: clientsError} = useClients();
  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    error: invoicesError,
  } = useInvoices({includeDrafts: true});

  const projectMetrics = useMemo(() => {
    const active = projects.filter((p) => p.status !== 'Delivered');
    const todayStr = getLocalISODate(0);
    const next7Str = getLocalISODate(7);
    const dueNext7Days = active
      .filter((p) => Boolean(p.dueDate) && p.dueDate >= todayStr && p.dueDate <= next7Str)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {activeCount: active.length, totalCount: projects.length, dueNext7Days};
  }, [projects]);

  const invoiceMetrics = useMemo(() => {
    const unpaid = invoices.filter((inv) => {
      const effective = getEffectiveInvoiceStatus(inv);
      return effective === 'Sent' || effective === 'Overdue';
    });
    const overdueCount = unpaid.filter(
      (inv) => getEffectiveInvoiceStatus(inv) === 'Overdue',
    ).length;
    const totalUnpaidAmount = unpaid.reduce((sum, inv) => sum + inv.amount, 0);

    return {unpaidCount: unpaid.length, overdueCount, totalUnpaidAmount};
  }, [invoices]);

  const activeLoginCount = useMemo(
    () => clients.filter((c) => c.hasLoginAccount).length,
    [clients],
  );

  const dashboardError = projectsError || clientsError || invoicesError;

  return (
    <section className="space-y-8">
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

      <AdminKpiStrip
        loadingProjects={loadingProjects}
        loadingClients={loadingClients}
        loadingInvoices={loadingInvoices}
        activeProjectsCount={projectMetrics.activeCount}
        totalProjectsCount={projectMetrics.totalCount}
        totalClientsCount={clients.length}
        activeLoginCount={activeLoginCount}
        unpaidCount={invoiceMetrics.unpaidCount}
        overdueCount={invoiceMetrics.overdueCount}
        totalUnpaidAmount={invoiceMetrics.totalUnpaidAmount}
      />

      <UpcomingDeadlinesTable projects={projectMetrics.dueNext7Days} loading={loadingProjects} />
    </section>
  );
}
