import type {AuthError, Session, User} from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {supabase} from '../lib/supabase';

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

interface AuthContextValue {
  user: PortalUser | null;
  profile: UserProfile | null;
  authUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  authError: string | null;
  isPasswordRecovery: boolean;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateRecoveryPassword: (newPassword: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split('@')[0] || 'SD';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function toPortalUser(profile: UserProfile, authUser: User | null): PortalUser {
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
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (message) {
    return message;
  }
  return 'An unexpected authentication error occurred. Please try again.';
}

async function fetchProfileRow(userId: string): Promise<UserProfile | null> {
  const {data, error} = await supabase
    .from('profiles')
    .select('id, full_name, email, role, client_id, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to load portal profile.');
  }

  if (!data) {
    return null;
  }

  return {
    id: String(data.id),
    full_name: String(data.full_name ?? ''),
    email: String(data.email ?? ''),
    role: data.role === 'admin' ? 'admin' : 'client',
    client_id: data.client_id ? String(data.client_id) : null,
    created_at: data.created_at ? String(data.created_at) : undefined,
  };
}

export function AuthProvider({children}: {children: ReactNode}) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const hadActiveSessionRef = useRef(false);
  const manualSignOutRef = useRef(false);
  const syncSeqRef = useRef(0);

  useEffect(() => {
    let active = true;

    const applySession = async (
      session: Session | null,
      options: {silent?: boolean; recovery?: boolean} = {},
    ) => {
      const seq = ++syncSeqRef.current;

      if (!session?.user) {
        if (!active || seq !== syncSeqRef.current) return;
        setAuthUser(null);
        setProfile(null);
        setUser(null);
        setLoading(false);
        return;
      }

      if (!options.silent) {
        setLoading(true);
      }

      try {
        const profileRow = await fetchProfileRow(session.user.id);
        if (!active || seq !== syncSeqRef.current) return;

        if (!profileRow) {
          manualSignOutRef.current = true;
          await supabase.auth.signOut({scope: 'local'});
          if (!active || seq !== syncSeqRef.current) return;
          hadActiveSessionRef.current = false;
          setAuthUser(null);
          setProfile(null);
          setUser(null);
          setAuthError(
            'No portal profile was found for this account. Please contact Stack Dev.',
          );
          return;
        }

        hadActiveSessionRef.current = true;
        setAuthUser(session.user);
        setProfile(profileRow);
        setUser(toPortalUser(profileRow, session.user));
        if (options.recovery) {
          setIsPasswordRecovery(true);
        }
        setAuthError(null);
      } catch (err) {
        if (!active || seq !== syncSeqRef.current) return;
        if (!options.silent) {
          setAuthError(mapAuthErrorMessage(err));
        }
      } finally {
        if (active && seq === syncSeqRef.current) {
          setLoading(false);
        }
      }
    };

    const initSession = async () => {
      try {
        const {data, error} = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          manualSignOutRef.current = true;
          await supabase.auth.signOut({scope: 'local'});
          if (!active) return;
          hadActiveSessionRef.current = false;
          setAuthUser(null);
          setProfile(null);
          setUser(null);
          setAuthError('Your session has expired. Please sign in again.');
          setLoading(false);
          return;
        }

        const hashIndicatesRecovery =
          typeof window !== 'undefined' &&
          window.location.hash.includes('type=recovery');

        await applySession(data.session, {recovery: hashIndicatesRecovery});
      } catch {
        if (!active) return;
        setAuthUser(null);
        setProfile(null);
        setUser(null);
        setAuthError('Unable to verify your session. Please sign in again.');
        setLoading(false);
      }
    };

    void initSession();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'SIGNED_OUT') {
        syncSeqRef.current += 1;
        const wasUnexpected =
          hadActiveSessionRef.current && !manualSignOutRef.current;
        manualSignOutRef.current = false;
        hadActiveSessionRef.current = false;

        setAuthUser(null);
        setProfile(null);
        setUser(null);
        setIsPasswordRecovery(false);
        setLoading(false);

        if (wasUnexpected) {
          setAuthError('Your session has expired. Please sign in again.');
        }
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setTimeout(() => {
          if (active) {
            void applySession(session, {recovery: true});
          }
        }, 0);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        if (!session) {
          setAuthUser(null);
          setProfile(null);
          setUser(null);
          hadActiveSessionRef.current = false;
          setAuthError('Your session has expired. Please sign in again.');
          return;
        }
        setTimeout(() => {
          if (active) {
            void applySession(session, {silent: true});
          }
        }, 0);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setTimeout(() => {
          if (active) {
            void applySession(session, {
              silent: event === 'USER_UPDATED',
            });
          }
        }, 0);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const cleanEmail = email.trim();
    const {data, error} = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      const msg = mapAuthErrorMessage(error);
      setAuthError(msg);
      throw new Error(msg);
    }

    if (!data.user) {
      const msg = 'Unable to sign in. Please try again.';
      setAuthError(msg);
      throw new Error(msg);
    }

    const profileRow = await fetchProfileRow(data.user.id);
    if (!profileRow) {
      manualSignOutRef.current = true;
      await supabase.auth.signOut({scope: 'local'});
      const msg =
        'No portal profile was found for this account. Please contact Stack Dev.';
      setAuthError(msg);
      throw new Error(msg);
    }

    hadActiveSessionRef.current = true;
    setIsPasswordRecovery(false);
    setAuthUser(data.user);
    setProfile(profileRow);
    setUser(toPortalUser(profileRow, data.user));
  };

  const signOut = async () => {
    manualSignOutRef.current = true;
    hadActiveSessionRef.current = false;
    setAuthError(null);
    setIsPasswordRecovery(false);
    const {error} = await supabase.auth.signOut();
    if (error) {
      // Clear local session cleanly even if remote revoke fails on an expired token
      await supabase.auth.signOut({scope: 'local'});
    }
    setAuthUser(null);
    setProfile(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

    const {error} = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      throw new Error(mapAuthErrorMessage(error));
    }
  };

  const updateRecoveryPassword = async (newPassword: string) => {
    const {data, error} = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(mapAuthErrorMessage(error));
    }

    setIsPasswordRecovery(false);
    if (data.user) {
      setAuthUser(data.user);
      const profileRow = await fetchProfileRow(data.user.id);
      if (profileRow) {
        setProfile(profileRow);
        setUser(toPortalUser(profileRow, data.user));
      }
    }
  };

  const updateProfileName = async (name: string) => {
    if (!profile) {
      throw new Error('You must be signed in to update your profile.');
    }
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 120) {
      throw new Error('Please enter a valid name (1 to 120 characters).');
    }

    const {data, error} = await supabase
      .from('profiles')
      .update({full_name: cleanName})
      .eq('id', profile.id)
      .select('id, full_name, email, role, client_id, created_at')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Unable to update your profile name.');
    }

    const updatedProfile: UserProfile = {
      id: String(data.id),
      full_name: String(data.full_name ?? cleanName),
      email: String(data.email ?? profile.email),
      role: data.role === 'admin' ? 'admin' : 'client',
      client_id: data.client_id ? String(data.client_id) : null,
      created_at: data.created_at ? String(data.created_at) : profile.created_at,
    };

    setProfile(updatedProfile);
    setUser(toPortalUser(updatedProfile, authUser));
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    const currentEmail = profile?.email || authUser?.email;
    if (!currentEmail) {
      throw new Error(
        'You must be signed in with email and password to update your password.',
      );
    }

    // Re-verify current password without triggering unexpected session expiry errors
    const {error: verifyError} = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });

    if (verifyError) {
      throw new Error('Your current password is incorrect. Please try again.');
    }

    const {error: updateError} = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error(mapAuthErrorMessage(updateError));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authUser,
        isAuthenticated: Boolean(user),
        loading,
        authError,
        isPasswordRecovery,
        clearAuthError: () => setAuthError(null),
        signIn,
        signOut,
        login: signIn,
        logout: signOut,
        resetPassword,
        updateRecoveryPassword,
        updateProfileName,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
