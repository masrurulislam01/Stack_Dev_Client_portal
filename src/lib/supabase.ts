import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {env, envValidationError, isDemoMode} from '@/lib/env';
import {createMockSupabaseClient} from '@/lib/mockSupabase';

/**
 * Single shared Supabase client for browser usage (anon/publishable key only).
 * Uses the in-memory demo stub when VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are unconfigured.
 */
export const supabase: SupabaseClient = isDemoMode
  ? createMockSupabaseClient()
  : !envValidationError && env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : (new Proxy(
        {},
        {
          get() {
            throw (
              envValidationError ??
              new Error('Supabase environment variables are not configured.')
            );
          },
        },
      ) as SupabaseClient);
