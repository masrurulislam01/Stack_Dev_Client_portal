import {useQuery, useQueryClient} from '@tanstack/react-query';
import {
  BadgeCheck,
  FileText,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import {useEffect, useMemo} from 'react';
import {NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../context/LanguageContext';
import {useTheme} from '../context/ThemeContext';
import {queryKeys} from '../lib/queryKeys';
import {countUnread, subscribeToMessages} from '../services/messages';
import {list as listPaymentSubmissions} from '../services/payments';
import {NotificationBell} from './NotificationBell';

export function PortalLayout() {
  const {user, signOut} = useAuth();
  const {theme, toggleTheme} = useTheme();
  const {language, toggleLanguage, t} = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

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

  const pendingPaymentsCount = pendingPayments.length;

  useEffect(() => {
    if (!userId) return;
    return subscribeToMessages(() => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.unreadPrefix,
      });
    });
  }, [queryClient, userId]);

  const adminNavItems = useMemo(
    () => [
      {to: '/admin/dashboard', label: t.nav.adminDashboard, icon: LayoutDashboard},
      {to: '/admin/clients', label: t.nav.clients, icon: ShieldCheck},
      {to: '/admin/projects', label: t.nav.projects, icon: FolderKanban},
      {to: '/admin/payments', label: t.nav.paymentsToVerify, icon: BadgeCheck},
    ],
    [t],
  );

  const sharedAdminNavItems = useMemo(
    () => [
      {to: '/invoices', label: t.nav.invoices, icon: FileText},
      {to: '/files', label: t.nav.files, icon: FolderOpen},
      {to: '/messages', label: t.nav.messages, icon: MessageSquare},
      {to: '/settings', label: t.nav.settings, icon: Settings},
    ],
    [t],
  );

  const clientNavItems = useMemo(
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

  const mobileNavItems = useMemo(
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

      {/* Desktop Sidebar */}
      <aside className="print:hidden hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <NavLink
            to={isAdmin ? '/admin/dashboard' : '/dashboard'}
            className="text-xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400 whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            Stack Dev
          </NavLink>
        </div>

        <nav aria-label="Primary Navigation" className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {isAdmin && (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.nav.administration}
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const showPendingBadge =
                  item.to === '/admin/payments' && pendingPaymentsCount > 0;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({isActive}) =>
                      `flex items-center justify-between gap-2 min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {showPendingBadge && (
                      <span
                        aria-label={`${pendingPaymentsCount} pending payments`}
                        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-semibold tabular-nums shrink-0"
                      >
                        {pendingPaymentsCount > 99 ? '99+' : pendingPaymentsCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}

          <div className="space-y-1">
            {isAdmin && (
              <div className="px-3 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.nav.clientWorkspace}
              </div>
            )}
            {(isAdmin ? sharedAdminNavItems : clientNavItems).map((item) => {
              const Icon = item.icon;
              const showBadge = item.to === '/messages' && unreadMessagesCount > 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({isActive}) =>
                    `flex items-center justify-between gap-2 min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {showBadge && (
                    <span
                      aria-label={`${unreadMessagesCount} unread messages`}
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-semibold tabular-nums shrink-0"
                    >
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <span>Stack Dev</span>
          <span aria-hidden="true"> · </span>
          <span>{t.nav.studioLocation}</span>
        </div>
      </aside>

      {/* Main Column */}
      <div className="md:pl-64 print:pl-0 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="print:hidden sticky top-0 z-20 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <NavLink
              to={isAdmin ? '/admin/dashboard' : '/dashboard'}
              className="md:hidden text-lg font-bold tracking-tight text-indigo-700 dark:text-indigo-400 whitespace-nowrap shrink-0 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Stack Dev
            </NavLink>
            <h1 className="hidden md:block text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {isAdmin && (
              <NavLink
                to="/files"
                aria-label={t.nav.files}
                className={({isActive}) =>
                  `md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <FolderOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              </NavLink>
            )}

            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={t.topbar.switchLanguage}
              title={t.topbar.switchLanguage}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {language === 'en' ? 'বাংলা' : 'EN'}
            </button>

            <NotificationBell />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t.topbar.switchToLight : t.topbar.switchToDark}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <div className="flex items-center gap-2.5 pl-1.5 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
              <div
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shrink-0 select-none"
              >
                {user?.initials ?? 'SD'}
              </div>
              <div className="hidden sm:flex flex-col min-w-0 max-w-[160px]">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user?.name ?? 'User'}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {isAdmin ? t.topbar.roleAdmin : t.topbar.roleClient}
                  {user?.clientId ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      {user.clientId}
                    </>
                  ) : null}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              aria-label={t.topbar.logout}
              className="inline-flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t.topbar.logout}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" tabIndex={-1} className="flex-1 pb-24 md:pb-8 print:pb-0 focus:outline-none">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className={`print:hidden md:hidden fixed bottom-0 inset-x-0 z-20 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 grid ${
          isAdmin ? 'grid-cols-7' : 'grid-cols-6'
        }`}
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const showMsgBadge = item.to === '/messages' && unreadMessagesCount > 0;
          const showPayBadge =
            item.to === '/admin/payments' && pendingPaymentsCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({isActive}) =>
                `relative flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 text-[10px] font-medium transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 ${
                  isActive
                    ? 'text-indigo-700 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <span className="relative inline-flex">
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                {showMsgBadge && (
                  <span
                    aria-label={`${unreadMessagesCount} unread messages`}
                    className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold tabular-nums ring-2 ring-white dark:ring-slate-900"
                  >
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
                {showPayBadge && (
                  <span
                    aria-label={`${pendingPaymentsCount} pending payments`}
                    className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold tabular-nums ring-2 ring-white dark:ring-slate-900"
                  >
                    {pendingPaymentsCount > 99 ? '99+' : pendingPaymentsCount}
                  </span>
                )}
              </span>
              <span className="truncate max-w-full whitespace-nowrap">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
