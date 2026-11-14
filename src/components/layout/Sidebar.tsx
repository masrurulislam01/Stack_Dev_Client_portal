import {PanelLeftClose, PanelLeftOpen, type LucideIcon} from 'lucide-react';
import {NavLink} from 'react-router-dom';
import {BrandLogo} from '@/components/layout/BrandLogo';
import {useLanguage} from '@/hooks/useLanguage';
import type {PortalUser} from '@/services/auth';
import {getAvatarToneClass} from '@/utils/avatar';

export interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  isAdmin: boolean;
  user: PortalUser | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  adminNavItems: NavItemConfig[];
  workspaceNavItems: NavItemConfig[];
  unreadMessagesCount: number;
  pendingPaymentsCount: number;
}

function SidebarLink({
  item,
  collapsed,
  badgeCount,
  badgeClassName,
  badgeLabel,
}: {
  item: NavItemConfig;
  collapsed: boolean;
  badgeCount: number;
  badgeClassName: string;
  badgeLabel: string;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      title={item.label}
      className={({isActive}) =>
        `group relative flex items-center ${
          collapsed ? 'justify-center lg:px-0' : 'md:justify-center lg:justify-between lg:px-3'
        } gap-2 min-h-[44px] px-2 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
          isActive
            ? 'bg-primary-50 text-primary-700 font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-primary-600'
            : 'text-body hover:text-foreground hover:bg-surface-muted'
        }`
      }
    >
      {({isActive}) => (
        <>
          <span
            className={`flex items-center gap-3 min-w-0 ${
              collapsed ? 'justify-center' : 'md:justify-center lg:justify-start'
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                isActive ? 'text-primary-600' : 'text-muted group-hover:text-foreground'
              }`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span className={collapsed ? 'sr-only' : 'hidden lg:inline truncate'}>
              {item.label}
            </span>
          </span>
          {badgeCount > 0 && (
            <span
              aria-label={badgeLabel}
              className={`${
                collapsed
                  ? 'absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 text-[10px]'
                  : 'md:absolute md:top-1.5 md:right-1.5 lg:static min-w-[20px] h-5 px-1.5 text-[11px]'
              } inline-flex items-center justify-center rounded-full text-white font-semibold num shrink-0 ${badgeClassName}`}
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({
  isAdmin,
  user,
  collapsed,
  onToggleCollapse,
  adminNavItems,
  workspaceNavItems,
  unreadMessagesCount,
  pendingPaymentsCount,
}: SidebarProps) {
  const {t} = useLanguage();
  const avatarTone = getAvatarToneClass(user?.name || user?.email || 'SD');

  return (
    <aside
      className={`print:hidden hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-border transition-[width] duration-200 z-30 ${
        collapsed ? 'md:w-[76px]' : 'md:w-[76px] lg:w-[264px]'
      }`}
    >
      <div
        className={`h-16 flex items-center ${
          collapsed ? 'justify-center px-3' : 'justify-center lg:justify-between px-3 lg:px-5'
        } border-b border-border shrink-0`}
      >
        <NavLink
          to={isAdmin ? '/admin/dashboard' : '/dashboard'}
          className="rounded-xl p-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <span className={collapsed ? 'inline-flex' : 'inline-flex lg:hidden'}>
            <BrandLogo collapsed />
          </span>
          {!collapsed && (
            <span className="hidden lg:inline-flex">
              <BrandLogo />
            </span>
          )}
        </NavLink>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
            collapsed ? 'absolute -right-4 top-4 bg-surface border border-border shadow-xs' : ''
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <nav aria-label="Primary Navigation" className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {isAdmin && (
          <div className="space-y-1">
            {!collapsed && (
              <div className="hidden lg:block px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                {t.nav.administration}
              </div>
            )}
            {adminNavItems.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={collapsed}
                badgeCount={item.to === '/admin/payments' ? pendingPaymentsCount : 0}
                badgeClassName="bg-warning"
                badgeLabel={`${pendingPaymentsCount} pending payments`}
              />
            ))}
          </div>
        )}

        <div className="space-y-1">
          {isAdmin && !collapsed && (
            <div className="hidden lg:block px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
              {t.nav.clientWorkspace}
            </div>
          )}
          {workspaceNavItems.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              badgeCount={item.to === '/messages' ? unreadMessagesCount : 0}
              badgeClassName="bg-primary-600"
              badgeLabel={`${unreadMessagesCount} unread messages`}
            />
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-border space-y-3 shrink-0">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-surface-muted/70 border border-border/70 ${
            collapsed ? 'justify-center' : 'md:justify-center lg:justify-start'
          }`}
        >
          <div
            aria-hidden="true"
            className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0 select-none ${avatarTone}`}
          >
            {user?.initials ?? 'SD'}
          </div>
          {!collapsed && (
            <div className="hidden lg:flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate">
                {user?.name ?? 'User'}
              </span>
              <span className="text-[11px] text-muted truncate">
                {isAdmin ? t.topbar.roleAdmin : t.topbar.roleClient}
                {user?.clientId ? ` · ${user.clientId}` : ''}
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="hidden lg:flex items-center justify-between px-2 text-[11px] text-subtle">
            <span>Stack Dev</span>
            <span>{t.nav.studioLocation}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
