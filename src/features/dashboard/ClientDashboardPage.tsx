import {useQuery} from '@tanstack/react-query';
import {ArrowRight} from 'lucide-react';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {ActiveProjectsGrid} from '@/features/dashboard/ActiveProjectsGrid';
import {ClientKpiStrip} from '@/features/dashboard/ClientKpiStrip';
import {RecentUpdatesList} from '@/features/dashboard/RecentUpdatesList';
import {useAuth, useInvoices, useLanguage, useProjects} from '@/hooks';
import {queryKeys} from '@/lib/queryKeys';
import {getErrorMessage} from '@/services/serviceUtils';
import {list as listUpdates} from '@/services/updates';
import {getEffectiveInvoiceStatus} from '@/utils/invoices';

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
  } = useProjects(clientId, Boolean(clientId));

  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    error: invoicesError,
  } = useInvoices({clientId, includeDrafts: false}, Boolean(clientId));

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
    return {totalUnpaidAmount, unpaidCount: unpaid.length, overdueCount: overdue.length};
  }, [invoices]);

  const dashboardError = projectsError || invoicesError || updatesError;

  return (
    <section className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            {getGreeting()}, {user?.name ?? 'Client'}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Here is a live summary of your active projects, billing, and latest updates from Stack
            Dev.
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

      <ClientKpiStrip
        loadingInvoices={loadingInvoices}
        loadingProjects={loadingProjects}
        totalUnpaidAmount={invoiceSummary.totalUnpaidAmount}
        unpaidCount={invoiceSummary.unpaidCount}
        overdueCount={invoiceSummary.overdueCount}
        activeProjectsCount={activeProjects.length}
        totalProjectsCount={projects.length}
      />

      <ActiveProjectsGrid
        activeProjects={activeProjects}
        totalProjectsCount={projects.length}
        loading={loadingProjects}
      />

      <RecentUpdatesList updates={updates} loading={loadingUpdates} />
    </section>
  );
}
