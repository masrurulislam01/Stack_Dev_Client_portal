import type {AuthChangeEvent, AuthError, Session, User} from '@supabase/supabase-js';
import {supabase} from '@/lib/supabase';
import {parseServiceInput} from '@/services/serviceUtils';
import {
  changePasswordInputSchema,
  resetPasswordInputSchema,
  signInInputSchema,
  updateProfileNameInputSchema,
  updateRecoveryPasswordInputSchema,
} from '@/types/schemas';

export type UserRole = 'admin' | 'client';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  client_id: string | null;
  created_at?: string;
}

export interface PortalUser {
  id: string;
  uid: string;
  name: string;
  full_name: string;
  email: string;
  role: UserRole;
  clientId: string;
  client_id: string | null;
  initials: string;
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split('@')[0] || 'SD';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function toPortalUser(profile: UserProfile, authUser: User | null): PortalUser {
  const resolvedEmail = profile.email || authUser?.email || '';
  const resolvedName =
    profile.full_name.trim() || resolvedEmail.split('@')[0] || 'Portal User';
  return {
    id: profile.id,
    uid: profile.id,
    name: resolvedName,
    full_name: resolvedName,
    email: resolvedEmail,
    role: profile.role,
    clientId: profile.client_id ?? '',
    client_id: profile.client_id,
    initials: getInitials(resolvedName, resolvedEmail),
  };
}

export function mapAuthErrorMessage(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as {message?: unknown}).message ?? '')
      : error instanceof Error
        ? error.message
        : '';

  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as AuthError).status)
      : 0;

  const lower = message.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_credentials')
  ) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Your account email is not confirmed yet. Please ask Stack Dev to confirm it or resend your reset link.';
  }
  if (
    lower.includes('refresh token') ||
    lower.includes('jwt expired') ||
    lower.includes('session not found') ||
    lower.includes('invalid jwt')
  ) {
    return 'Your session has expired. Please sign in again.';
  }
  if (
    status === 429 ||
    lower.includes('rate limit') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('too many requests')
  ) {
    return 'Too many requests. Please wait a minute before trying again.';
  }
  if (lower.includes('new password should be different')) {
    return 'Your new password must be different from your previous password.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (message) {
    return message;
  }
  return 'An unexpected authentication error occurred. Please try again.';
}

export async function fetchProfileRow(userId: string): Promise<UserProfile | null> {
  const {data, error} = await supabase
    .from('profiles')
    .select('id, full_name, email, role, client_id, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to load portal profile.');
  }

  if (!data) return null;

  return {
    id: String(data.id),
    full_name: String(data.full_name ?? ''),
    email: String(data.email ?? ''),
    role: data.role === 'admin' ? 'admin' : 'client',
    client_id: data.client_id ? String(data.client_id) : null,
    created_at: data.created_at ? String(data.created_at) : undefined,
  };
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function signOutLocal() {
  return supabase.auth.signOut({scope: 'local'});
}

export async function signOut() {
  const {error} = await supabase.auth.signOut();
  if (error) {
    await supabase.auth.signOut({scope: 'local'});
  }
}

export async function signInWithEmailPassword(email: string, password: string): Promise<{
  authUser: User;
  profile: UserProfile;
  portalUser: PortalUser;
}> {
  const valid = parseServiceInput(signInInputSchema, {email, password});
  const {data, error} = await supabase.auth.signInWithPassword({
    email: valid.email,
    password: valid.password,
  });

  if (error) {
    throw new Error(mapAuthErrorMessage(error));
  }
  if (!data.user) {
    throw new Error('Unable to sign in. Please try again.');
  }

  const profileRow = await fetchProfileRow(data.user.id);
  if (!profileRow) {
    await supabase.auth.signOut({scope: 'local'});
    throw new Error(
      'No portal profile was found for this account. Please contact Stack Dev.',
    );
  }

  return {
    authUser: data.user,
    profile: profileRow,
    portalUser: toPortalUser(profileRow, data.user),
  };
}

export async function resetPassword(email: string): Promise<void> {
  const valid = parseServiceInput(resetPasswordInputSchema, {email});
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : undefined;

  const {error} = await supabase.auth.resetPasswordForEmail(valid.email, {
    redirectTo,
  });
  if (error) {
    throw new Error(mapAuthErrorMessage(error));
  }
}

export async function updateRecoveryPassword(newPassword: string): Promise<{
  authUser: User | null;
  profile: UserProfile | null;
}> {
  const valid = parseServiceInput(updateRecoveryPasswordInputSchema, {newPassword});
  const {data, error} = await supabase.auth.updateUser({
    password: valid.newPassword,
  });
  if (error) {
    throw new Error(mapAuthErrorMessage(error));
  }
  if (!data.user) {
    return {authUser: null, profile: null};
  }
  await supabase.auth.signOut({scope: 'others'}).catch(() => undefined);
  const profileRow = await fetchProfileRow(data.user.id);
  return {authUser: data.user, profile: profileRow};
}

export async function updateProfileName(
  profileId: string,
  name: string,
): Promise<UserProfile> {
  const valid = parseServiceInput(updateProfileNameInputSchema, {profileId, name});

  const {data, error} = await supabase
    .from('profiles')
    .update({full_name: valid.name})
    .eq('id', valid.profileId)
    .select('id, full_name, email, role, client_id, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update your profile name.');
  }

  return {
    id: String(data.id),
    full_name: String(data.full_name ?? valid.name),
    email: String(data.email ?? ''),
    role: data.role === 'admin' ? 'admin' : 'client',
    client_id: data.client_id ? String(data.client_id) : null,
    created_at: data.created_at ? String(data.created_at) : undefined,
  };
}

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const valid = parseServiceInput(changePasswordInputSchema, {
    email,
    currentPassword,
    newPassword,
  });

  const {error: verifyError} = await supabase.auth.signInWithPassword({
    email: valid.email,
    password: valid.currentPassword,
  });
  if (verifyError) {
    throw new Error('Your current password is incorrect. Please try again.');
  }

  const {error: updateError} = await supabase.auth.updateUser({
    password: valid.newPassword,
  });
  if (updateError) {
    throw new Error(mapAuthErrorMessage(updateError));
  }
  await supabase.auth.signOut({scope: 'others'}).catch(() => undefined);
}
