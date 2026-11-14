import {Moon, Sun} from 'lucide-react';
import {useLanguage} from '@/hooks/useLanguage';
import {useTheme} from '@/hooks/useTheme';

export function AuthTopBar({showBrand = false}: {showBrand?: boolean}) {
  const {theme, toggleTheme} = useTheme();
  const {language, toggleLanguage, t} = useLanguage();

  return (
    <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3">
      {showBrand ? (
        <span className="text-xl font-bold tracking-tight text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
          Stack Dev
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t.topbar.switchLanguage}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          {language === 'en' ? 'বাংলা' : 'EN'}
        </button>
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
      </div>
    </div>
  );
}
