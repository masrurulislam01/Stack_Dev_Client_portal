import type {Session, User} from '@supabase/supabase-js';
import {createContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {
  mapAuthErrorMessage,
  resolveSessionState,
  sendPasswordResetEmail,
  signInWithCredentials,
  signOutSession,
  updatePasswordFromRecovery,
  updateProfileDisplayName,
  verifyAndChangePassword,
  type PortalUser,
  type UserProfile,
  type UserRole,
} from '@/features/auth/authHelpers';
import {supabase} from '@/lib/supabase';

export type {PortalUser, UserProfile, UserRole};

export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

    const clearIdentity = (errorMsg: string | null = null) => {
      setAuthUser(null);
      setProfile(null);
      setUser(null);
      if (errorMsg) setAuthError(errorMsg);
    };

    const applySession = async (
      session: Session | null,
      options: {silent?: boolean; recovery?: boolean} = {},
    ) => {
      const seq = ++syncSeqRef.current;
      if (!session?.user) {
        if (!active || seq !== syncSeqRef.current) return;
        clearIdentity();
        setLoading(false);
        return;
      }
      if (!options.silent) setLoading(true);
      try {
        const resolved = await resolveSessionState(session);
        if (!active || seq !== syncSeqRef.current) return;
        if (resolved.status === 'missing-profile') {
          manualSignOutRef.current = true;
          await supabase.auth.signOut({scope: 'local'});
          if (!active || seq !== syncSeqRef.current) return;
          hadActiveSessionRef.current = false;
          clearIdentity('No portal profile was found for this account. Please contact Stack Dev.');
          return;
        }
        if (resolved.status === 'authenticated') {
          hadActiveSessionRef.current = true;
          setAuthUser(resolved.authUser);
          setProfile(resolved.profile);
          setUser(resolved.user);
          if (options.recovery) setIsPasswordRecovery(true);
          setAuthError(null);
        }
      } catch (err) {
        if (!active || seq !== syncSeqRef.current) return;
        if (!options.silent) setAuthError(mapAuthErrorMessage(err));
      } finally {
        if (active && seq === syncSeqRef.current) setLoading(false);
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
          clearIdentity('Your session has expired. Please sign in again.');
          setLoading(false);
          return;
        }
        const hashRecovery =
          typeof window !== 'undefined' && window.location.hash.includes('type=recovery');
        await applySession(data.session, {recovery: hashRecovery});
      } catch {
        if (!active) return;
        clearIdentity('Unable to verify your session. Please sign in again.');
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
        const wasUnexpected = hadActiveSessionRef.current && !manualSignOutRef.current;
        manualSignOutRef.current = false;
        hadActiveSessionRef.current = false;
        clearIdentity(wasUnexpected ? 'Your session has expired. Please sign in again.' : null);
        setIsPasswordRecovery(false);
        setLoading(false);
        return;
      }
      if (event === 'PASSWORD_RECOVERY') {
        setTimeout(() => active && void applySession(session, {recovery: true}), 0);
        return;
      }
      if (event === 'TOKEN_REFRESHED') {
        if (!session) {
          hadActiveSessionRef.current = false;
          clearIdentity('Your session has expired. Please sign in again.');
          return;
        }
        setTimeout(() => active && void applySession(session, {silent: true}), 0);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setTimeout(
          () => active && void applySession(session, {silent: event === 'USER_UPDATED'}),
          0,
        );
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const result = await signInWithCredentials(email, password);
      hadActiveSessionRef.current = true;
      setIsPasswordRecovery(false);
      setAuthUser(result.authUser);
      setProfile(result.profile);
      setUser(result.user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : mapAuthErrorMessage(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signOut = async () => {
    manualSignOutRef.current = true;
    hadActiveSessionRef.current = false;
    setAuthError(null);
    setIsPasswordRecovery(false);
    await signOutSession();
    setAuthUser(null);
    setProfile(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    await sendPasswordResetEmail(email);
  };

  const updateRecoveryPassword = async (newPassword: string) => {
    const result = await updatePasswordFromRecovery(newPassword);
    setIsPasswordRecovery(false);
    if (result.authUser) setAuthUser(result.authUser);
    if (result.profile) setProfile(result.profile);
    if (result.user) setUser(result.user);
  };

  const updateProfileName = async (name: string) => {
    if (!profile) throw new Error('You must be signed in to update your profile.');
    const result = await updateProfileDisplayName(profile, authUser, name);
    setProfile(result.profile);
    setUser(result.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const currentEmail = profile?.email || authUser?.email;
    if (!currentEmail) {
      throw new Error('You must be signed in with email and password to update your password.');
    }
    await verifyAndChangePassword(currentEmail, currentPassword, newPassword);
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
