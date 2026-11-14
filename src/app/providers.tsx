import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {AuthProvider} from '@/app/AuthProvider';
import {ErrorBoundary, ToastViewport} from '@/components/ui';
import {LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY} from '@/config/constants';
import {LanguageContext} from '@/hooks/useLanguage';
import {ThemeContext, type Theme} from '@/hooks/useTheme';
import {ToastContext, type ToastApi, type ToastItem, type ToastVariant} from '@/hooks/useToast';
import {translations, type Language} from '@/i18n/translations';

export function ThemeProvider({children}: {children: ReactNode}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{theme, toggleTheme, setTheme: setThemeState}}>
      {children}
    </ThemeContext.Provider>
  );
}

function LanguageProvider({children}: {children: ReactNode}) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'bn' ? 'bn' : 'en';
  });

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: setLanguageState,
        toggleLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, title: string, description?: string): string => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev.slice(-4), {id, variant, title, description}]);

      const durationMs = variant === 'error' ? 7500 : 4500;
      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, durationMs);
      timersRef.current.set(id, timer);

      return id;
    },
    [],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      error: (title, description) => show('error', title, description),
      success: (title, description) => show('success', title, description),
      info: (title, description) => show('info', title, description),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({children}: {children: ReactNode}) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              <AuthProvider>{children}</AuthProvider>
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
