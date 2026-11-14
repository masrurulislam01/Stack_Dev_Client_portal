import {Moon, Sun} from 'lucide-react';
import {BrandLogo} from '@/components/layout/BrandLogo';
import {useLanguage} from '@/hooks/useLanguage';
import {useTheme} from '@/hooks/useTheme';

export function AuthTopBar({showBrand = false}: {showBrand?: boolean}) {
  const {theme, toggleTheme} = useTheme();
  const {language, toggleLanguage, t} = useLanguage();

  return (
    <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
      {showBrand ? <BrandLogo size="sm" /> : <span />}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t.topbar.switchLanguage}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-muted hover:border-border-strong transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {language === 'en' ? 'বাং' : 'EN'}
        </button>
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
      </div>
    </div>
  );
}
