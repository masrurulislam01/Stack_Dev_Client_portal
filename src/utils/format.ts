export function formatBDT(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `৳${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(safeAmount)}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toDateObj(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatTimestamp(value: unknown): string {
  if (!value) return 'Just now';
  const d = toDateObj(value);
  if (d) {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return 'Recently';
}

export function formatDateTime(value: unknown): string {
  if (!value) return 'Just now';
  const d = toDateObj(value);
  if (!d) return 'Recently';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function toMillis(value: unknown): number {
  const d = toDateObj(value);
  return d ? d.getTime() : 0;
}

export function formatChatTime(value: unknown): string {
  const d = toDateObj(value);
  if (!d) return 'Sending...';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatChatDayLabel(value: unknown): string {
  const d = toDateObj(value);
  if (!d) return 'Today';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((today - target) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}
