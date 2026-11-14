export interface AppEnv {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
}

function readCleanEnv(value: unknown): string {
  if (typeof value !== 'string') return '';
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function looksLikeSupabaseKey(value: string): boolean {
  return (
    value.startsWith('sb_publishable_') ||
    value.startsWith('sb_secret_') ||
    value.startsWith('eyJ')
  );
}

function isServiceRoleKey(value: string): boolean {
  if (value.startsWith('sb_secret_')) {
    return true;
  }
  if (value.startsWith('eyJ')) {
    try {
      const parts = value.split('.');
      if (parts.length === 3 && typeof atob === 'function') {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64)) as {role?: string};
        return payload?.role === 'service_role';
      }
    } catch {
      return false;
    }
  }
  return false;
}

function validateSupabaseUrl(value: string): string | null {
  if (!value) {
    return 'VITE_SUPABASE_URL is missing. Set it to your Supabase Project URL (e.g. "https://<project-ref>.supabase.co").';
  }
  if (isServiceRoleKey(value)) {
    return 'VITE_SUPABASE_URL contains a Supabase secret/service_role key. Replace it with your Project URL ("https://<project-ref>.supabase.co") and never put secret keys in the browser.';
  }
  if (looksLikeSupabaseKey(value)) {
    return 'VITE_SUPABASE_URL contains a Supabase API key instead of your Project URL ("https://<project-ref>.supabase.co"). Move the publishable key to VITE_SUPABASE_ANON_KEY.';
  }
  if (!isValidHttpUrl(value)) {
    return 'VITE_SUPABASE_URL is invalid. Expected a valid http(s) URL (e.g. "https://<project-ref>.supabase.co").';
  }
  return null;
}

function validateSupabaseAnonKey(value: string): string | null {
  if (!value) {
    return 'VITE_SUPABASE_ANON_KEY is missing. Set it to your public Supabase publishable ("sb_publishable_...") or anon key.';
  }
  if (isServiceRoleKey(value)) {
    return 'Security error: VITE_SUPABASE_ANON_KEY contains a Supabase service_role or "sb_secret_" key. Remove it immediately and use only your public "sb_publishable_..." or "anon" key in the browser.';
  }
  if (isValidHttpUrl(value)) {
    return 'VITE_SUPABASE_ANON_KEY contains a URL instead of your public publishable/anon key.';
  }
  return null;
}

/**
 * Validates all public frontend environment variables in one place.
 * Falls back to local in-memory demo mode when neither Supabase variable is set.
 */
export function validateEnv(): {env: AppEnv; isDemoMode: boolean} {
  const metaEnv = (import.meta as ImportMeta & {env?: Record<string, unknown>}).env ?? {};
  let rawUrl = readCleanEnv(metaEnv.VITE_SUPABASE_URL);
  let rawAnonKey = readCleanEnv(metaEnv.VITE_SUPABASE_ANON_KEY);

  // When unconfigured (e.g. imported preview without .env), run with the in-memory stub
  if (!rawUrl && !rawAnonKey) {
    return {
      env: {
        supabaseUrl: '',
        supabaseAnonKey: '',
      },
      isDemoMode: true,
    };
  }

  // Auto-recover cleanly if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY were swapped
  if (
    rawUrl &&
    rawAnonKey &&
    !isValidHttpUrl(rawUrl) &&
    looksLikeSupabaseKey(rawUrl) &&
    !isServiceRoleKey(rawUrl) &&
    isValidHttpUrl(rawAnonKey)
  ) {
    console.warn(
      '[env] Detected swapped VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values; auto-correcting at runtime. Please swap them in your environment configuration.',
    );
    const tmp = rawUrl;
    rawUrl = rawAnonKey;
    rawAnonKey = tmp;
  }

  const issues: string[] = [];
  const urlIssue = validateSupabaseUrl(rawUrl);
  if (urlIssue) issues.push(urlIssue);

  const keyIssue = validateSupabaseAnonKey(rawAnonKey);
  if (keyIssue) issues.push(keyIssue);

  if (issues.length > 0) {
    throw new Error(issues.join('\n'));
  }

  return {
    env: {
      supabaseUrl: rawUrl.replace(/\/+$/, ''),
      supabaseAnonKey: rawAnonKey,
    },
    isDemoMode: false,
  };
}

let resolvedEnv: AppEnv = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
let resolvedDemoMode = true;
let resolvedError: Error | null = null;

try {
  const result = validateEnv();
  resolvedEnv = result.env;
  resolvedDemoMode = result.isDemoMode;
} catch (err) {
  resolvedDemoMode = false;
  resolvedError =
    err instanceof Error
      ? err
      : new Error('Invalid Supabase environment configuration.');
  console.warn('[env] Supabase configuration needs attention:', resolvedError.message);
}

export const env: AppEnv = resolvedEnv;
export const isDemoMode: boolean = resolvedDemoMode;
export const envValidationError: Error | null = resolvedError;
