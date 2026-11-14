import type {ReactNode} from 'react';
import {useAuthSession} from '@/app/useAuthSession';
import {AuthContext} from '@/hooks/useAuth';
import {
  changePassword as changePasswordSvc,
  mapAuthErrorMessage,
  resetPassword as resetPasswordSvc,
  signInWithEmailPassword,
  signOut as signOutSvc,
  toPortalUser,
  updateProfileName as updateProfileNameSvc,
  updateRecoveryPassword as updateRecoveryPasswordSvc,
} from '@/services/auth';

export function AuthProvider({children}: {children: ReactNode}) {
  const {
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
  } = useAuthSession();

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const result = await signInWithEmailPassword(email, password);
      hadActiveSessionRef.current = true;
      setIsPasswordRecovery(false);
      setAuthUser(result.authUser);
      setProfile(result.profile);
      setUser(result.portalUser);
    } catch (err) {
      const msg = mapAuthErrorMessage(err);
      setAuthError(msg);
      throw err instanceof Error ? err : new Error(msg);
    }
  };

  const signOut = async () => {
    manualSignOutRef.current = true;
    hadActiveSessionRef.current = false;
    setAuthError(null);
    setIsPasswordRecovery(false);
    await signOutSvc();
    clearState();
  };

  const updateRecoveryPassword = async (newPassword: string) => {
    const result = await updateRecoveryPasswordSvc(newPassword);
    setIsPasswordRecovery(false);
    if (result.authUser) {
      setAuthUser(result.authUser);
      if (result.profile) {
        setProfile(result.profile);
        setUser(toPortalUser(result.profile, result.authUser));
      }
    }
  };

  const updateProfileName = async (name: string) => {
    if (!profile) throw new Error('You must be signed in to update your profile.');
    const updatedProfile = await updateProfileNameSvc(profile.id, name);
    setProfile(updatedProfile);
    setUser(toPortalUser(updatedProfile, authUser));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const currentEmail = profile?.email || authUser?.email;
    if (!currentEmail) {
      throw new Error('You must be signed in with email and password to update your password.');
    }
    await changePasswordSvc(currentEmail, currentPassword, newPassword);
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
        resetPassword: async (email: string) => {
          setAuthError(null);
          await resetPasswordSvc(email);
        },
        updateRecoveryPassword,
        updateProfileName,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
