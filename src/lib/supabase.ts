import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {env, envValidationError} from './env';

/**
 * Single shared Supabase client for browser usage (anon/publishable key only).
 * Startup validation happens in src/lib/env.ts.
 */
export const supabase: SupabaseClient =
  !envValidationError && env.supabaseUrl && env.supabaseAnonKey
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
