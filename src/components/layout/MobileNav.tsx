import {NavLink} from 'react-router-dom';
import type {NavItemConfig} from '@/components/layout/Sidebar';

interface MobileNavProps {
  isAdmin: boolean;
  items: NavItemConfig[];
  unreadMessagesCount: number;
  pendingPaymentsCount: number;
}

export function MobileNav({
  isAdmin,
  items,
  unreadMessagesCount,
  pendingPaymentsCount,
}: MobileNavProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className={`print:hidden md:hidden fixed bottom-0 inset-x-0 z-20 min-h-[64px] pb-[env(safe-area-inset-bottom)] bg-surface/95 backdrop-blur-md border-t border-border grid ${
        isAdmin ? 'grid-cols-7' : 'grid-cols-6'
      }`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const showMsgBadge = item.to === '/messages' && unreadMessagesCount > 0;
        const showPayBadge =
          item.to === '/admin/payments' && pendingPaymentsCount > 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({isActive}) =>
              `relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] py-1.5 px-0.5 text-[10px] transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring ${
                isActive
                  ? 'text-primary-600 font-semibold'
                  : 'text-muted hover:text-foreground font-medium'
              }`
            }
          >
            {({isActive}) => (
              <>
                <span
                  className={`relative inline-flex items-center justify-center px-2.5 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-primary-50' : ''
                  }`}
                >
                  <Icon
                    className="w-[18px] h-[18px] shrink-0"
                    strokeWidth={isActive ? 2.15 : 1.75}
                    aria-hidden="true"
                  />
                  {showMsgBadge && (
                    <span
                      aria-label={`${unreadMessagesCount} unread messages`}
                      className="absolute -top-0.5 right-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary-600 text-white text-[9px] font-bold num ring-2 ring-surface"
                    >
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                  {showPayBadge && (
                    <span
                      aria-label={`${pendingPaymentsCount} pending payments`}
                      className="absolute -top-0.5 right-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-warning text-white text-[9px] font-bold num ring-2 ring-surface"
                    >
                      {pendingPaymentsCount > 99 ? '99+' : pendingPaymentsCount}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-full whitespace-nowrap">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
