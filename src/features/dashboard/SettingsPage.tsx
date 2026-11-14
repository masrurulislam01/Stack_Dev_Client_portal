import {AppearanceSettingsCard} from '@/features/dashboard/AppearanceSettingsCard';
import {BackupExportCard} from '@/features/dashboard/BackupExportCard';
import {ProfileSettingsCard} from '@/features/dashboard/ProfileSettingsCard';
import {SecuritySettingsCard} from '@/features/dashboard/SecuritySettingsCard';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';

export function SettingsPage() {
  const {user} = useAuth();
  const {t} = useLanguage();
  const isAdmin = user?.role === 'admin';

  return (
    <section className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t.settings.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.settings.subtitle}</p>
      </div>

      <ProfileSettingsCard />
      <SecuritySettingsCard />
      <AppearanceSettingsCard />
      {isAdmin && <BackupExportCard />}
    </section>
  );
}
