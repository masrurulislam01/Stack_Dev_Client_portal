import type {LucideIcon} from 'lucide-react';
import {NavLink} from 'react-router-dom';
import {useLanguage} from '@/hooks/useLanguage';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  isAdmin: boolean;
  adminNavItems: NavItemConfig[];
  workspaceNavItems: NavItemConfig[];
  unreadMessagesCount: number;
  pendingPaymentsCount: number;
}

function SidebarLink({
  item,
  badgeCount,
  badgeClassName,
  badgeLabel,
}: {
  item: NavItemConfig;
  badgeCount: number;
  badgeClassName: string;
  badgeLabel: string;
}) {
  const Icon = item.icon;
  return (
    <NavLink
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
      {badgeCount > 0 && (
        <span
          aria-label={badgeLabel}
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-white text-[11px] font-semibold tabular-nums shrink-0 ${badgeClassName}`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({
  isAdmin,
  adminNavItems,
  workspaceNavItems,
  unreadMessagesCount,
  pendingPaymentsCount,
}: SidebarProps) {
  const {t} = useLanguage();

  return (
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
            {adminNavItems.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                badgeCount={item.to === '/admin/payments' ? pendingPaymentsCount : 0}
                badgeClassName="bg-amber-500"
                badgeLabel={`${pendingPaymentsCount} pending payments`}
              />
            ))}
          </div>
        )}

        <div className="space-y-1">
          {isAdmin && (
            <div className="px-3 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.nav.clientWorkspace}
            </div>
          )}
          {workspaceNavItems.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              badgeCount={item.to === '/messages' ? unreadMessagesCount : 0}
              badgeClassName="bg-indigo-600"
              badgeLabel={`${unreadMessagesCount} unread messages`}
            />
          ))}
        </div>
      </nav>

      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <span>Stack Dev</span>
        <span aria-hidden="true"> · </span>
        <span>{t.nav.studioLocation}</span>
      </div>
    </aside>
  );
}
