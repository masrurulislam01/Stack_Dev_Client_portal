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
