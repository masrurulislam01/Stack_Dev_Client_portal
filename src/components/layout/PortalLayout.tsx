import {useQueryClient} from '@tanstack/react-query';
import {
  BadgeCheck,
  FileText,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import {useMemo} from 'react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {MobileBottomNav} from '@/components/layout/MobileBottomNav';
import {Sidebar, type NavItemConfig} from '@/components/layout/Sidebar';
import {Topbar} from '@/components/layout/Topbar';
import {useAuth, useLanguage, usePaymentSubmissions, useUnreadMessagesCount} from '@/hooks';

export function PortalLayout() {
  const {user, signOut} = useAuth();
  const {t} = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin';
  const userId = user?.id ?? '';
  const clientId = user?.clientId || undefined;

  const {data: unreadMessagesCount = 0} = useUnreadMessagesCount({
    userId,
    viewerRole: user?.role ?? 'client',
    clientId: isAdmin ? undefined : clientId,
    enabled: Boolean(userId && (isAdmin || clientId)),
  });

  const {data: pendingPayments = []} = usePaymentSubmissions(
    {status: 'Pending'},
    'pending',
    Boolean(userId && isAdmin),
  );

  const adminNavItems = useMemo<NavItemConfig[]>(
    () => [
      {to: '/admin/dashboard', label: t.nav.adminDashboard, icon: LayoutDashboard},
      {to: '/admin/clients', label: t.nav.clients, icon: ShieldCheck},
      {to: '/admin/projects', label: t.nav.projects, icon: FolderKanban},
      {to: '/admin/payments', label: t.nav.paymentsToVerify, icon: BadgeCheck},
    ],
    [t],
  );

  const sharedAdminNavItems = useMemo<NavItemConfig[]>(
    () => [
      {to: '/invoices', label: t.nav.invoices, icon: FileText},
      {to: '/files', label: t.nav.files, icon: FolderOpen},
      {to: '/messages', label: t.nav.messages, icon: MessageSquare},
      {to: '/settings', label: t.nav.settings, icon: Settings},
    ],
    [t],
  );

  const clientNavItems = useMemo<NavItemConfig[]>(
    () => [
      {to: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard},
      {to: '/projects', label: t.nav.projects, icon: FolderKanban},
      {to: '/invoices', label: t.nav.invoices, icon: FileText},
      {to: '/files', label: t.nav.files, icon: FolderOpen},
      {to: '/messages', label: t.nav.messages, icon: MessageSquare},
      {to: '/settings', label: t.nav.settings, icon: Settings},
    ],
    [t],
  );

  const mobileNavItems = useMemo<NavItemConfig[]>(
    () =>
      isAdmin
        ? [
            {to: '/admin/dashboard', label: t.nav.adminDashboard, icon: LayoutDashboard},
            {to: '/admin/clients', label: t.nav.clients, icon: ShieldCheck},
            {to: '/admin/projects', label: t.nav.projects, icon: FolderKanban},
            {to: '/admin/payments', label: t.nav.paymentsToVerify, icon: BadgeCheck},
            {to: '/invoices', label: t.nav.invoices, icon: FileText},
            {to: '/messages', label: t.nav.messages, icon: MessageSquare},
            {to: '/settings', label: t.nav.settings, icon: Settings},
          ]
        : clientNavItems,
    [isAdmin, clientNavItems, t],
  );

  const allNavItems = isAdmin ? [...adminNavItems, ...sharedAdminNavItems] : clientNavItems;
  const currentNav = allNavItems.find((item) => location.pathname.startsWith(item.to));
  const pageTitle = currentNav?.label ?? (isAdmin ? t.nav.adminDashboard : t.nav.dashboard);

  const handleLogout = async () => {
    await signOut();
    queryClient.clear();
    navigate('/login', {replace: true});
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-indigo-600 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        {t.nav.skipToContent}
      </a>

      <Sidebar
        isAdmin={isAdmin}
        adminNavItems={adminNavItems}
        primaryNavItems={isAdmin ? sharedAdminNavItems : clientNavItems}
        administrationLabel={t.nav.administration}
        clientWorkspaceLabel={t.nav.clientWorkspace}
        studioLocationLabel={t.nav.studioLocation}
        unreadMessagesCount={unreadMessagesCount}
        pendingPaymentsCount={pendingPayments.length}
      />

      <div className="md:pl-64 print:pl-0 flex flex-col min-h-screen">
        <Topbar isAdmin={isAdmin} pageTitle={pageTitle} user={user} onLogout={handleLogout} />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 pb-24 md:pb-8 print:pb-0 focus:outline-none"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav
        isAdmin={isAdmin}
        items={mobileNavItems}
        unreadMessagesCount={unreadMessagesCount}
        pendingPaymentsCount={pendingPayments.length}
      />
    </div>
  );
}
