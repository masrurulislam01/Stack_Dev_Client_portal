import type {LucideIcon} from 'lucide-react';
import {NavLink} from 'react-router-dom';
import {AGENCY_NAME} from '@/lib/constants';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarProps {
  isAdmin: boolean;
  adminNavItems: NavItemConfig[];
  primaryNavItems: NavItemConfig[];
  administrationLabel: string;
  clientWorkspaceLabel: string;
  studioLocationLabel: string;
  unreadMessagesCount: number;
  pendingPaymentsCount: number;
}

export function Sidebar({
  isAdmin,
  adminNavItems,
  primaryNavItems,
  administrationLabel,
  clientWorkspaceLabel,
  studioLocationLabel,
  unreadMessagesCount,
  pendingPaymentsCount,
}: SidebarProps) {
  const linkClass = ({isActive}: {isActive: boolean}) =>
    `flex items-center justify-between gap-2 min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
    }`;

  return (
    <aside className="print:hidden hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <NavLink
          to={isAdmin ? '/admin/dashboard' : '/dashboard'}
          className="text-xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400 whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          {AGENCY_NAME}
        </NavLink>
      </div>

      <nav aria-label="Primary Navigation" className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {isAdmin && (
          <div className="space-y-1">
            <div className="px-3 pb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {administrationLabel}
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const showPending = item.to === '/admin/payments' && pendingPaymentsCount > 0;
              return (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {showPending && (
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
              {clientWorkspaceLabel}
            </div>
          )}
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const showUnread = item.to === '/messages' && unreadMessagesCount > 0;
            return (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {showUnread && (
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
        <span>{AGENCY_NAME}</span>
        <span aria-hidden="true"> · </span>
        <span>{studioLocationLabel}</span>
      </div>
    </aside>
  );
}
