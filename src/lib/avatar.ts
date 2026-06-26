export function getInitials(name?: string | null, email?: string | null): string {
  const raw = (name ?? '').trim();
  if (raw) {
    const parts = raw.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    const out = `${first}${last}`.toUpperCase();
    return out || 'U';
  }
  const fallback = (email ?? '').trim();
  if (fallback) return fallback.slice(0, 2).toUpperCase();
  return 'U';
}

