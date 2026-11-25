import * as Keychain from 'react-native-keychain';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setSessionRenewedListener } from './api';
import type { Session } from './types';

/**
 * The linked-device session lives in the Keychain (iOS) / Keystore-backed storage (Android),
 * readable only while the phone is unlocked, and never synced or backed up to another device.
 */

const KEY = 'nops.session.v1';
const opts = { service: KEY, accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export async function readSession(): Promise<Session | null> {
  try {
    const c = await Keychain.getGenericPassword({ service: KEY });
    return c ? (JSON.parse(c.password) as Session) : null;
  } catch {
    return null;
  }
}

async function writeSession(s: Session | null) {
  if (s) await Keychain.setGenericPassword('session', JSON.stringify(s), opts);
  else await Keychain.resetGenericPassword({ service: KEY });
}

type Status = 'loading' | 'ready';

interface SessionContextValue {
  status: Status;
  session: Session | null;
  save: (s: Session) => Promise<void>;
  clear: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    readSession()
      .then(setSession)
      .finally(() => setStatus('ready'));
  }, []);

  const save = useCallback(async (s: Session) => {
    await writeSession(s);
    setSession(s);
  }, []);

  const clear = useCallback(async () => {
    await writeSession(null);
    setSession(null);
  }, []);

  // The API renews its 3-hour session id; keep the new one.
  useEffect(() => setSessionRenewedListener((s) => void save(s)), [save]);

  const value = useMemo(() => ({ status, session, save, clear }), [status, session, save, clear]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
