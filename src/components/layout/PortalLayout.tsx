import {useQuery, useQueryClient} from '@tanstack/react-query';
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
import {useEffect, useMemo, useState} from 'react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {MobileNav} from '@/components/layout/MobileNav';
import {Sidebar, type NavItemConfig} from '@/components/layout/Sidebar';
import {Topbar} from '@/components/layout/Topbar';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {queryKeys} from '@/lib/queryKeys';
import {countUnread, subscribeToMessages} from '@/services/messages';
import {list as listPaymentSubmissions} from '@/services/payments';

export function PortalLayout() {
  const {user, signOut} = useAuth();
  const {t} = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const userId = user?.id ?? '';
  const clientId = user?.clientId || undefined;

  const {data: unreadMessagesCount = 0} = useQuery({
    queryKey: queryKeys.messages.unreadCount({
      userId,
      clientId: isAdmin ? undefined : clientId,
    }),
    queryFn: () =>
      countUnread({
        viewerId: userId,
        viewerRole: user?.role ?? 'client',
        clientId: isAdmin ? undefined : clientId,
      }),
    enabled: Boolean(userId && (isAdmin || clientId)),
  });

  const {data: pendingPayments = []} = useQuery({
    queryKey: queryKeys.payments.list('pending'),
    queryFn: () => listPaymentSubmissions({status: 'Pending'}),
    enabled: Boolean(userId && isAdmin),
  });

  useEffect(() => {
    if (!userId) return;
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.unreadPrefix,
      });
    });
  }, [queryClient, userId]);

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
  const isDashboard =
    location.pathname === '/dashboard' || location.pathname === '/admin/dashboard';

  const handleLogout = async () => {
    await signOut();
    queryClient.clear();
    navigate('/login', {replace: true});
  };

  return (
    <div className="min-h-screen bg-background text-body overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-gradient-brand focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-[3px] focus:ring-ring"
      >
        {t.nav.skipToContent}
      </a>

      <Sidebar
        isAdmin={isAdmin}
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        adminNavItems={adminNavItems}
        workspaceNavItems={isAdmin ? sharedAdminNavItems : clientNavItems}
        unreadMessagesCount={unreadMessagesCount}
        pendingPaymentsCount={pendingPayments.length}
      />

      <div
        className={`${
          sidebarCollapsed ? 'md:pl-[76px]' : 'md:pl-[76px] lg:pl-[264px]'
        } print:pl-0 flex flex-col min-h-screen transition-[padding] duration-200 relative`}
      >
        {isDashboard && (
          <div
            aria-hidden="true"
            className="print:hidden pointer-events-none absolute inset-x-0 top-16 h-80 bg-gradient-hero opacity-80"
          />
        )}

        <Topbar
          user={user}
          isAdmin={isAdmin}
          pageTitle={pageTitle}
          onLogout={() => void handleLogout()}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="relative flex-1 pb-24 md:pb-8 print:pb-0 focus:outline-none"
        >
          <div
            key={location.pathname}
            className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0 print:max-w-none"
          >
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav
        isAdmin={isAdmin}
        items={mobileNavItems}
        unreadMessagesCount={unreadMessagesCount}
        pendingPaymentsCount={pendingPayments.length}
      />
    </div>
  );
}
