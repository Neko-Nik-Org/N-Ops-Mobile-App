import { Redirect, useLocalSearchParams } from '@/lib/router';

import { isCompleteCode, normalizeCode, normalizeServer, parseUserId } from '@/lib/linkPayload';
import { useSession } from '@/lib/session';

/**
 * Deep link target: nops://link?server=https://api.example.com&user_id=12&code=…
 * If the QR encodes this URL, scanning it with the phone's own camera app opens N-Ops
 * and links straight away.
 */
export default function LinkDeepLink() {
  const { code = '', server = '', user_id } = useLocalSearchParams<{ code?: string; server?: string; user_id?: string }>();
  const { status, session } = useSession();
  if (status !== 'ready') return null;
  if (session) return <Redirect href="/home" />;
  const c = normalizeCode(code);
  const userId = parseUserId(user_id);
  const s = normalizeServer(server) ?? '';
  if (userId === null || !isCompleteCode(c)) return <Redirect href={{ pathname: '/code', params: { code: c, server, userId: user_id } }} />;
  return <Redirect href={{ pathname: '/linking', params: { code: c, server: s, userId: String(userId) } }} />;
}
