/** "acme · production", or just "acme" when there is no environment. */
export const workspaceLabel = (w: { name: string; environment: string }) => [w.name, w.environment].filter(Boolean).join(' · ');

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "now", "4m", "2h", "3d" — the compact times used in lists. */
export function shortAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/** "2m ago" for card subtitles. */
export function ago(iso: string, now = Date.now()): string {
  const v = shortAgo(iso, now);
  return v === 'now' ? 'just now' : `${v} ago`;
}

export function hostOf(server: string): string {
  return server.replace(/^https?:\/\//, '');
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
