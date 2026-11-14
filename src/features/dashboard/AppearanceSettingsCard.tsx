import {Languages, Moon, Sun} from 'lucide-react';
import {useLanguage} from '@/hooks/useLanguage';
import {useTheme} from '@/hooks/useTheme';

export function AppearanceSettingsCard() {
  const {theme, setTheme} = useTheme();
  const {language, setLanguage, t} = useLanguage();

  return (
    <div className="bg-surface rounded-2xl border border-border card-inset p-6 space-y-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <Languages className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {t.settings.appearanceSection}
          </h3>
          <p className="text-xs text-muted mt-0.5">{t.settings.appearanceHint}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
        <div className="space-y-2.5">
          <p className="text-[13px] font-semibold text-foreground">{t.settings.themeLabel}</p>
          <div
            className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-muted border border-border"
            role="group"
            aria-label={t.settings.themeLabel}
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              className={`inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                theme === 'light'
                  ? 'bg-surface text-primary-700 shadow-xs border border-primary-200'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Sun className="w-4 h-4" aria-hidden="true" />
              <span>{t.settings.lightMode}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              className={`inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                theme === 'dark'
                  ? 'bg-surface text-primary-700 shadow-xs border border-primary-200'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Moon className="w-4 h-4" aria-hidden="true" />
              <span>{t.settings.darkMode}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-[13px] font-semibold text-foreground">{t.settings.languageLabel}</p>
          <div
            className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-muted border border-border"
            role="group"
            aria-label={t.settings.languageLabel}
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
              className={`inline-flex items-center justify-center min-h-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                language === 'en'
                  ? 'bg-surface text-primary-700 shadow-xs border border-primary-200'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              aria-pressed={language === 'bn'}
              className={`inline-flex items-center justify-center min-h-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                language === 'bn'
                  ? 'bg-surface text-primary-700 shadow-xs border border-primary-200'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              বাংলা
            </button>
          </div>
          <p className="text-xs text-muted">{t.settings.languageHint}</p>
        </div>
      </div>
    </div>
  );
}
