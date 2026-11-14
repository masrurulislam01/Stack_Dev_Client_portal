import type {User} from '@supabase/supabase-js';
import {createContext, useContext} from 'react';
import type {PortalUser, UserProfile, UserRole} from '@/services/auth';

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
