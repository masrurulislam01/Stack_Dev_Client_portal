const AVATAR_TONES = [
  'bg-primary-50 text-primary-700 border border-primary-200',
  'bg-info-soft text-info-text border border-info/25',
  'bg-success-soft text-success-text border border-success/25',
  'bg-warning-soft text-warning-text border border-warning/25',
  'bg-accent-gold-soft text-foreground border border-accent-gold/30',
] as const;

export function getAvatarToneClass(seed: string): string {
  const normalized = (seed || 'SD').trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function getInitials(name?: string | null, fallback = 'SD'): string {
  if (!name) return fallback;
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}
