import {useQuery} from '@tanstack/react-query';
import {ArrowRight, FolderKanban} from 'lucide-react';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {ErrorAlert} from '@/components/ui';
import {ClientActiveProjectsGrid} from '@/features/dashboard/ClientActiveProjectsGrid';
import {ClientRecentUpdatesCard} from '@/features/dashboard/ClientRecentUpdatesCard';
import {ClientSummaryStrip} from '@/features/dashboard/ClientSummaryStrip';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {queryKeys} from '@/lib/queryKeys';
import {list as listInvoices} from '@/services/invoices';
import {list as listProjects} from '@/services/projects';
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
    isFetching: fetchingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: queryKeys.projects.list(clientId),
    queryFn: () => listProjects({clientId}),
    enabled: Boolean(clientId),
  });

  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    isFetching: fetchingInvoices,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: queryKeys.invoices.list({clientId}),
    queryFn: () => listInvoices({clientId, includeDrafts: false}),
    enabled: Boolean(clientId),
  });

  const {
    data: updates = [],
    isLoading: loadingUpdates,
    isFetching: fetchingUpdates,
    error: updatesError,
    refetch: refetchUpdates,
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
    const totalUnpaidAmount = unpaid.reduce(
      (sum, inv) => sum + (Number.isFinite(inv.amount) ? inv.amount : 0),
      0,
    );
    return {totalUnpaidAmount, unpaidCount: unpaid.length, overdueCount: overdue.length};
  }, [invoices]);

  const dashboardError = projectsError || invoicesError || updatesError;
  const isRetrying =
    (Boolean(projectsError) && fetchingProjects) ||
    (Boolean(invoicesError) && fetchingInvoices) ||
    (Boolean(updatesError) && fetchingUpdates);

  const handleRetry = () => {
    if (projectsError) void refetchProjects();
    if (invoicesError) void refetchInvoices();
    if (updatesError) void refetchUpdates();
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-border">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5">
            Client Workspace
          </p>
          <h2 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground text-balance">
            {getGreeting()}, {user?.name ?? 'Client'}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Here is a live summary of your active projects, billing, and latest updates from Stack
            Dev.
          </p>
        </div>

        <Link
          to="/projects"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-border-strong bg-surface text-foreground hover:bg-surface-muted shadow-xs text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <FolderKanban className="w-4 h-4 text-primary-600 shrink-0" aria-hidden="true" />
          <span>{t.dashboard.viewAllProjects}</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </Link>
      </header>

      {dashboardError && (
        <ErrorAlert
          message={getErrorMessage(dashboardError, 'Unable to load workspace overview.')}
          onRetry={handleRetry}
          retrying={isRetrying}
        />
      )}

      <ClientSummaryStrip
        loadingInvoices={loadingInvoices}
        loadingProjects={loadingProjects}
        totalUnpaidAmount={invoiceSummary.totalUnpaidAmount}
        unpaidCount={invoiceSummary.unpaidCount}
        overdueCount={invoiceSummary.overdueCount}
        activeProjectsCount={activeProjects.length}
        totalProjectsCount={projects.length}
      />

      <ClientActiveProjectsGrid
        loading={loadingProjects}
        activeProjects={activeProjects}
        totalProjectsCount={projects.length}
      />

      <ClientRecentUpdatesCard loading={loadingUpdates} updates={updates} />
    </section>
  );
}
