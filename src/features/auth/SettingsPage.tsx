import {AppearanceSettingsCard} from '@/features/auth/AppearanceSettingsCard';
import {BackupExportCard} from '@/features/auth/BackupExportCard';
import {PasswordSettingsCard} from '@/features/auth/PasswordSettingsCard';
import {ProfileSettingsCard} from '@/features/auth/ProfileSettingsCard';
import {useAuth, useLanguage} from '@/hooks';

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
      <PasswordSettingsCard />
      <AppearanceSettingsCard />
      {isAdmin && <BackupExportCard />}
    </section>
  );
}
