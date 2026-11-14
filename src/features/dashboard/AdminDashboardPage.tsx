import {useQuery} from '@tanstack/react-query';
import {ArrowRight, FileText, FolderKanban, Users} from 'lucide-react';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {ErrorAlert} from '@/components/ui';
import {AdminDeadlinesTable} from '@/features/dashboard/AdminDeadlinesTable';
import {AdminKpiStrip} from '@/features/dashboard/AdminKpiStrip';
import {useLanguage} from '@/hooks/useLanguage';
import {queryKeys} from '@/lib/queryKeys';
import {list as listClients} from '@/services/clients';
import {list as listInvoices} from '@/services/invoices';
import {list as listProjects} from '@/services/projects';
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

  const {
    data: projects = [],
    isLoading: loadingProjects,
    isFetching: fetchingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => listProjects(),
  });

  const {
    data: clients = [],
    isLoading: loadingClients,
    isFetching: fetchingClients,
    error: clientsError,
    refetch: refetchClients,
  } = useQuery({
    queryKey: queryKeys.clients.all,
    queryFn: () => listClients(),
  });

  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    isFetching: fetchingInvoices,
    error: invoicesError,
    refetch: refetchInvoices,
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
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

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
    const totalUnpaidAmount = unpaid.reduce(
      (sum, inv) => sum + (Number.isFinite(inv.amount) ? inv.amount : 0),
      0,
    );

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
  const isRetrying =
    (Boolean(projectsError) && fetchingProjects) ||
    (Boolean(clientsError) && fetchingClients) ||
    (Boolean(invoicesError) && fetchingInvoices);

  const handleRetry = () => {
    if (projectsError) void refetchProjects();
    if (clientsError) void refetchClients();
    if (invoicesError) void refetchInvoices();
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-border">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5">
            {todayFormatted}
          </p>
          <h2 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground text-balance">
            {t.dashboard.adminTitle}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.dashboard.adminSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/admin/clients"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-border-strong bg-surface text-foreground hover:bg-surface-muted text-sm font-semibold shadow-xs transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <Users className="w-4 h-4 text-muted" aria-hidden="true" />
            <span>{t.nav.clients}</span>
          </Link>

          <Link
            to="/invoices"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-border-strong bg-surface text-foreground hover:bg-surface-muted text-sm font-semibold shadow-xs transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <FileText className="w-4 h-4 text-muted" aria-hidden="true" />
            <span>{t.nav.invoices}</span>
          </Link>

          <Link
            to="/admin/projects"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-gradient-brand text-white hover:brightness-110 hover:shadow-brand text-sm font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <FolderKanban className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.dashboard.viewAllProjects}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {dashboardError && (
        <ErrorAlert
          message={getErrorMessage(dashboardError, 'Unable to load dashboard overview.')}
          onRetry={handleRetry}
          retrying={isRetrying}
        />
      )}

      <AdminKpiStrip
        loadingProjects={loadingProjects}
        loadingClients={loadingClients}
        loadingInvoices={loadingInvoices}
        activeProjectCount={projectMetrics.activeCount}
        totalProjectCount={projectMetrics.totalCount}
        totalClientCount={clients.length}
        activeLoginCount={activeLoginCount}
        unpaidCount={invoiceMetrics.unpaidCount}
        overdueCount={invoiceMetrics.overdueCount}
        totalUnpaidAmount={invoiceMetrics.totalUnpaidAmount}
      />

      <AdminDeadlinesTable loading={loadingProjects} projects={projectMetrics.dueNext7Days} />
    </section>
  );
}
