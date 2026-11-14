import {zodResolver} from '@hookform/resolvers/zod';
import {AlertCircle, CheckCircle2, User} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui';
import {useAuth} from '@/hooks/useAuth';
import {useLanguage} from '@/hooks/useLanguage';
import {
  profileNameFormSchema,
  type ProfileNameFormParsed,
  type ProfileNameFormValues,
} from '@/types/portal';

export function ProfileSettingsCard() {
  const {user, updateProfileName} = useAuth();
  const {t} = useLanguage();
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<ProfileNameFormValues, unknown, ProfileNameFormParsed>({
    resolver: zodResolver(profileNameFormSchema),
    defaultValues: {name: user?.name ?? ''},
  });

  useEffect(() => {
    if (user?.name) {
      reset({name: user.name});
    }
  }, [user?.name, reset]);

  const onSubmit = async (values: ProfileNameFormParsed) => {
    setProfileSuccess(null);
    setProfileError(null);
    try {
      await updateProfileName(values.name);
      setProfileSuccess(t.settings.profileSaved);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to update profile name.');
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border card-inset p-6 space-y-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <User className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {t.settings.profileSection}
          </h3>
          <p className="text-xs text-muted mt-0.5">{t.settings.profileHint}</p>
        </div>
      </div>

      {profileSuccess && (
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success-text flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {profileError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{profileError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="settings-name"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              {t.settings.fullName}
            </label>
            <input
              id="settings-name"
              type="text"
              disabled={isSubmitting}
              {...register('name')}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-surface text-sm text-foreground disabled:opacity-50 transition-colors focus:outline-none focus:ring-[3px] focus:ring-ring ${
                errors.name
                  ? 'border-danger focus:border-danger'
                  : 'border-border hover:border-border-strong focus:border-primary-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-text">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.name.message}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="settings-email"
              className="block text-[13px] font-semibold text-foreground mb-1.5"
            >
              {t.settings.emailAddress}
            </label>
            <input
              id="settings-email"
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-border bg-surface-muted text-sm text-muted cursor-not-allowed"
            />
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="rounded-xl bg-surface-muted border border-border px-3.5 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {t.settings.roleLabel}
            </dt>
            <dd className="mt-1 font-semibold text-foreground capitalize">
              {user?.role === 'admin' ? t.topbar.roleAdmin : t.topbar.roleClient}
            </dd>
          </div>
          <div className="rounded-xl bg-surface-muted border border-border px-3.5 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {t.settings.clientWorkspaceId}
            </dt>
            <dd className="mt-1 font-mono font-medium text-foreground truncate">
              {user?.clientId || '—'}
            </dd>
          </div>
        </dl>

        <div className="flex justify-end pt-1">
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? t.actions.saving : t.settings.saveProfile}
          </Button>
        </div>
      </form>
    </div>
  );
}
