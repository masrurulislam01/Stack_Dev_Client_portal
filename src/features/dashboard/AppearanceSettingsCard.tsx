import {Languages, Moon, Sun} from 'lucide-react';
import {useLanguage} from '@/hooks/useLanguage';
import {useTheme} from '@/hooks/useTheme';

export function AppearanceSettingsCard() {
  const {theme, setTheme} = useTheme();
  const {language, setLanguage, t} = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Languages className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.settings.appearanceSection}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t.settings.appearanceHint}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t.settings.themeLabel}
          </p>
          <div className="grid grid-cols-2 gap-2.5" role="group" aria-label={t.settings.themeLabel}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-4 h-4" aria-hidden="true" />
              <span>{t.settings.lightMode}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                theme === 'dark'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4" aria-hidden="true" />
              <span>{t.settings.darkMode}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t.settings.languageLabel}
          </p>
          <div
            className="grid grid-cols-2 gap-2.5"
            role="group"
            aria-label={t.settings.languageLabel}
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
              className={`inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                language === 'en'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              aria-pressed={language === 'bn'}
              className={`inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                language === 'bn'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              বাংলা
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.settings.languageHint}</p>
        </div>
      </div>
    </div>
  );
}
