import {zodResolver} from '@hookform/resolvers/zod';
import {CheckCircle2, User} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button, Card, CardContent, Input} from '@/components/ui';
import {useAuth, useLanguage} from '@/hooks';
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

  const onSaveProfile = async (values: ProfileNameFormParsed) => {
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
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.settings.profileSection}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {t.settings.profileHint}
            </p>
          </div>
        </div>

        {profileSuccess && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            {profileError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="settings-name"
              label={t.settings.fullName}
              type="text"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="settings-email"
              label={t.settings.emailAddress}
              type="email"
              value={user?.email ?? ''}
              disabled
              className="bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">{t.settings.roleLabel}</dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100 capitalize">
                {user?.role === 'admin' ? t.topbar.roleAdmin : t.topbar.roleClient}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">
                {t.settings.clientWorkspaceId}
              </dt>
              <dd className="mt-0.5 font-mono font-medium text-slate-900 dark:text-slate-100 truncate">
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
      </CardContent>
    </Card>
  );
}
