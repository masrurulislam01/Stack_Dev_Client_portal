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
        <h2 className="font-heading text-2xl sm:text-[30px] sm:leading-[38px] font-bold tracking-tight text-foreground">
          {t.settings.title}
        </h2>
        <p className="mt-1 text-sm text-muted leading-relaxed">{t.settings.subtitle}</p>
      </div>

      <ProfileSettingsCard />
      <SecuritySettingsCard />
      <AppearanceSettingsCard />
      {isAdmin && <BackupExportCard />}
    </section>
  );
}
