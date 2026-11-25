/**
 * What the Admin UI's "Link a mobile device" QR holds (see Admin UI `utils/deviceLink.ts`):
 *   {"type":"n-ops-device-link","version":1,"api":"https://…","user_id":12,"device_token":"…"}
 * Also accepted, so the phone's own camera can open the app:
 *   nops://link?server=https%3A%2F%2Fapi.example.com&user_id=12&code=…
 * Typing instead: user ID + device code, plus a server address when it isn't the default.
 */

export interface LinkPayload {
  userId: number;
  code: string;
  server?: string;
}

/** Device codes are random strings of letters and digits; spaces are never part of one. */
export const normalizeCode = (raw: string) => raw.replace(/\s+/g, '').slice(0, 64);
export const isCompleteCode = (code: string) => code.length >= 8;
export const parseUserId = (raw: string | undefined | null): number | null => (/^\d{1,18}$/.test((raw ?? '').trim()) ? Number(raw!.trim()) : null);

/** Normalises an API address: adds https://, drops trailing slashes, query and hash. Returns null if unusable. */
export function normalizeServer(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s || /\s/.test(s)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
  const m = /^(https?):\/\/([^/?#\s]+)([^?#\s]*)/i.exec(s);
  if (!m) return null;
  const scheme = m[1].toLowerCase();
  const host = m[2].toLowerCase();
  if (scheme === 'http' && !__DEV__) return null; // plain HTTP only while developing
  if (!/^[a-z0-9.-]+(:\d+)?$/.test(host) && !/^\[[0-9a-f:]+\](:\d+)?$/.test(host)) return null;
  return `${scheme}://${host}${m[3].replace(/\/+$/, '')}`;
}

function parseQuery(qs: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of qs.split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    try {
      out[decodeURIComponent((i < 0 ? part : part.slice(0, i)).replace(/\+/g, ' '))] = i < 0 ? '' : decodeURIComponent(part.slice(i + 1).replace(/\+/g, ' '));
    } catch {
      /* skip malformed pair */
    }
  }
  return out;
}

export function parseLinkPayload(data: string): LinkPayload | null {
  const s = (data ?? '').trim();
  if (s.startsWith('{')) {
    try {
      const j = JSON.parse(s) as { type?: unknown; version?: unknown; api?: unknown; user_id?: unknown; device_token?: unknown };
      const userId = parseUserId(String(j.user_id ?? ''));
      const code = typeof j.device_token === 'string' ? normalizeCode(j.device_token) : '';
      if (j.type !== 'n-ops-device-link' || j.version !== 1 || userId === null || !isCompleteCode(code)) return null;
      const server = normalizeServer(typeof j.api === 'string' ? j.api : undefined);
      return server ? { userId, code, server } : null; // the QR always names its API
    } catch {
      return null;
    }
  }
  const m = /^nops:\/\/link\/?\?([^#]*)/i.exec(s);
  if (!m) return null;
  const q = parseQuery(m[1]);
  const userId = parseUserId(q.user_id);
  const code = normalizeCode(q.code ?? '');
  if (userId === null || !isCompleteCode(code)) return null;
  const server = normalizeServer(q.server);
  return server ? { userId, code, server } : { userId, code };
}
