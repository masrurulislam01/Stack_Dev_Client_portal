import {NavLink} from 'react-router-dom';
import type {NavItemConfig} from '@/components/layout/Sidebar';

export interface MobileBottomNavProps {
  isAdmin: boolean;
  items: NavItemConfig[];
  unreadMessagesCount: number;
  pendingPaymentsCount: number;
}

export function MobileBottomNav({
  isAdmin,
  items,
  unreadMessagesCount,
  pendingPaymentsCount,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className={`print:hidden md:hidden fixed bottom-0 inset-x-0 z-20 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 grid ${
        isAdmin ? 'grid-cols-7' : 'grid-cols-6'
      }`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const showMsgBadge = item.to === '/messages' && unreadMessagesCount > 0;
        const showPayBadge = item.to === '/admin/payments' && pendingPaymentsCount > 0;

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
  );
}
