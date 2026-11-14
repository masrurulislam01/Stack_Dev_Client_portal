import {FolderOpen, LogOut, Moon, Sun} from 'lucide-react';
import {NavLink} from 'react-router-dom';
import {BrandLogo} from '@/components/layout/BrandLogo';
import {NotificationBell} from '@/features/notifications/NotificationBell';
import {useLanguage} from '@/hooks/useLanguage';
import {useTheme} from '@/hooks/useTheme';
import type {PortalUser} from '@/services/auth';
import {getAvatarToneClass} from '@/utils/avatar';

interface TopbarProps {
  user: PortalUser | null;
  isAdmin: boolean;
  pageTitle: string;
  onLogout: () => void;
}

export function Topbar({user, isAdmin, pageTitle, onLogout}: TopbarProps) {
  const {theme, toggleTheme} = useTheme();
  const {language, toggleLanguage, t} = useLanguage();
  const avatarTone = getAvatarToneClass(user?.name || user?.email || 'SD');

  return (
    <header className="print:hidden sticky top-0 z-20 h-16 bg-surface/90 backdrop-blur-md border-b border-border px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <NavLink
          to={isAdmin ? '/admin/dashboard' : '/dashboard'}
          className="md:hidden rounded-xl py-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <BrandLogo size="sm" />
        </NavLink>
        <div className="hidden md:flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-muted shrink-0">Stack Dev</span>
          <span className="text-xs text-subtle" aria-hidden="true">
            /
          </span>
          <h1 className="font-heading text-sm font-semibold text-foreground truncate">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {isAdmin && (
          <NavLink
            to="/files"
            aria-label={t.nav.files}
            className={({isActive}) =>
              `md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-body hover:bg-surface-muted'
              }`
            }
          >
            <FolderOpen className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </NavLink>
        )}

        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t.topbar.switchLanguage}
          title={t.topbar.switchLanguage}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-muted hover:border-border-strong transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {language === 'en' ? 'বাং' : 'EN'}
        </button>

        <NotificationBell />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t.topbar.switchToLight : t.topbar.switchToDark}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-border bg-surface text-body hover:text-foreground hover:bg-surface-muted hover:border-border-strong transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>

        <div className="flex items-center gap-2.5 pl-1.5 sm:pl-3 border-l border-border">
          <div
            aria-hidden="true"
            className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center shrink-0 select-none ${avatarTone}`}
          >
            {user?.initials ?? 'SD'}
          </div>
          <div className="hidden sm:flex flex-col min-w-0 max-w-[160px]">
            <span className="text-sm font-semibold text-foreground truncate">
              {user?.name ?? 'User'}
            </span>
            <span className="text-xs text-muted truncate">
              {isAdmin ? t.topbar.roleAdmin : t.topbar.roleClient}
              {user?.clientId ? ` · ${user.clientId}` : ''}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          aria-label={t.topbar.logout}
          className="inline-flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium text-body hover:text-danger-text hover:bg-danger-soft transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">{t.topbar.logout}</span>
        </button>
      </div>
    </header>
  );
}
