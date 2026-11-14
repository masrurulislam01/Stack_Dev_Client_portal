import type {Session, User} from '@supabase/supabase-js';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {PortalUser, UserProfile} from '@/hooks/useAuth';
import {
  fetchProfileRow,
  getSession,
  mapAuthErrorMessage,
  onAuthStateChange,
  signOutLocal,
  toPortalUser,
} from '@/services/auth';

export function useAuthSession() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const hadActiveSessionRef = useRef(false);
  const manualSignOutRef = useRef(false);
  const syncSeqRef = useRef(0);

  const clearState = useCallback(() => {
    setAuthUser(null);
    setProfile(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const applySession = async (
      session: Session | null,
      options: {silent?: boolean; recovery?: boolean} = {},
    ) => {
      const seq = ++syncSeqRef.current;

      if (!session?.user) {
        if (!active || seq !== syncSeqRef.current) return;
        clearState();
        setLoading(false);
        return;
      }

      if (!options.silent) setLoading(true);

      try {
        const profileRow = await fetchProfileRow(session.user.id);
        if (!active || seq !== syncSeqRef.current) return;

        if (!profileRow) {
          manualSignOutRef.current = true;
          await signOutLocal();
          if (!active || seq !== syncSeqRef.current) return;
          hadActiveSessionRef.current = false;
          clearState();
          setAuthError('No portal profile was found for this account. Please contact Stack Dev.');
          return;
        }

        hadActiveSessionRef.current = true;
        setAuthUser(session.user);
        setProfile(profileRow);
        setUser(toPortalUser(profileRow, session.user));
        if (options.recovery) setIsPasswordRecovery(true);
        setAuthError(null);
      } catch (err) {
        if (!active || seq !== syncSeqRef.current) return;
        if (!options.silent) setAuthError(mapAuthErrorMessage(err));
      } finally {
        if (active && seq === syncSeqRef.current) setLoading(false);
      }
    };

    const initSession = async () => {
      try {
        const {data, error} = await getSession();
        if (!active) return;
        if (error) {
          manualSignOutRef.current = true;
          await signOutLocal();
          if (!active) return;
          hadActiveSessionRef.current = false;
          clearState();
          setAuthError('Your session has expired. Please sign in again.');
          setLoading(false);
          return;
        }
        const hashIndicatesRecovery =
          typeof window !== 'undefined' && window.location.hash.includes('type=recovery');
        await applySession(data.session, {recovery: hashIndicatesRecovery});
      } catch {
        if (!active) return;
        clearState();
        setAuthError('Unable to verify your session. Please sign in again.');
        setLoading(false);
      }
    };

    void initSession();

    const {data: {subscription}} = onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        syncSeqRef.current += 1;
        const wasUnexpected = hadActiveSessionRef.current && !manualSignOutRef.current;
        manualSignOutRef.current = false;
        hadActiveSessionRef.current = false;
        clearState();
        setIsPasswordRecovery(false);
        setLoading(false);
        if (wasUnexpected) setAuthError('Your session has expired. Please sign in again.');
        return;
      }
      if (event === 'PASSWORD_RECOVERY') {
        setTimeout(() => {
          if (active) void applySession(session, {recovery: true});
        }, 0);
        return;
      }
      if (event === 'TOKEN_REFRESHED') {
        if (!session) {
          clearState();
          hadActiveSessionRef.current = false;
          setAuthError('Your session has expired. Please sign in again.');
          return;
        }
        setTimeout(() => {
          if (active) void applySession(session, {silent: true});
        }, 0);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setTimeout(() => {
          if (active) void applySession(session, {silent: event === 'USER_UPDATED'});
        }, 0);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [clearState]);

  return {
    authUser,
    setAuthUser,
    profile,
    setProfile,
    user,
    setUser,
    loading,
    authError,
    setAuthError,
    isPasswordRecovery,
    setIsPasswordRecovery,
    hadActiveSessionRef,
    manualSignOutRef,
    clearState,
  };
}
