import {FolderOpen, LogOut, Moon, Sun} from 'lucide-react';
import {NavLink} from 'react-router-dom';
import type {PortalUser} from '@/features/auth/AuthContext';
import {NotificationBell} from '@/features/notifications/NotificationBell';
import {useLanguage, useTheme} from '@/hooks';
import {AGENCY_NAME} from '@/lib/constants';

export interface TopbarProps {
  isAdmin: boolean;
  pageTitle: string;
  user: PortalUser | null;
  onLogout: () => void;
}

export function Topbar({isAdmin, pageTitle, user, onLogout}: TopbarProps) {
  const {theme, toggleTheme} = useTheme();
  const {language, toggleLanguage, t} = useLanguage();

  return (
    <header className="print:hidden sticky top-0 z-20 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <NavLink
          to={isAdmin ? '/admin/dashboard' : '/dashboard'}
          className="md:hidden text-lg font-bold tracking-tight text-indigo-700 dark:text-indigo-400 whitespace-nowrap shrink-0 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          {AGENCY_NAME}
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
          onClick={onLogout}
          aria-label={t.topbar.logout}
          className="inline-flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] px-2.5 sm:px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{t.topbar.logout}</span>
        </button>
      </div>
    </header>
  );
}
