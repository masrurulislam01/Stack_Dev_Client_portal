import type {z} from 'zod';

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as {message?: unknown}).message ?? '')
      : error instanceof Error
        ? error.message
        : String(error);

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as {code?: unknown}).code ?? '')
      : '';

  const lower = raw.toLowerCase();

  if (code === '42501' || lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }
  if (code === '23505' || lower.includes('duplicate key')) {
    return 'A record with these details already exists.';
  }
  if (code === '23503' || lower.includes('foreign key')) {
    return 'This item references a missing or already deleted record.';
  }
  if (code === '22P02') {
    return 'Invalid record identifier or value format.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (lower.includes('bucket not found')) {
    return 'Supabase Storage bucket "project-files" was not found. Create a private "project-files" bucket in Supabase Storage.';
  }

  return raw.trim() || fallback;
}

export function parseServiceInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message || 'Invalid input provided.');
  }
  return result.data;
}

const SAFE_RECORD_ID_REGEX = /^[a-zA-Z0-9_-]{1,80}$/;

export function assertSafeRecordId(id: string, label = 'record'): string {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  if (!SAFE_RECORD_ID_REGEX.test(trimmed)) {
    throw new Error(`Invalid ${label} identifier.`);
  }
  return trimmed;
}
