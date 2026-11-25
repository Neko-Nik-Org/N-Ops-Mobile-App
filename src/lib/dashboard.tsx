import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from './api';
import { authenticate, getBiometricInfo } from './biometrics';
import { ApiError } from './errors';
import { useSession } from './session';
import type { Dashboard } from './types';

interface DashboardContextValue {
  data: Dashboard | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  approve: (id: string, label: string) => Promise<boolean>;
  approvedIds: ReadonlySet<string>;
}

const Ctx = createContext<DashboardContextValue | null>(null);

/** Dashboard data shared by the tabs (Home, Approvals badge). */
export function DashboardProvider({ children, onUnlinked }: { children: ReactNode; onUnlinked: () => void }) {
  const { session } = useSession();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedIds, setApproved] = useState<Set<string>>(new Set());

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!session) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        setData(await api.dashboard(session));
        setError(null);
      } catch (e) {
        if (e instanceof ApiError && e.kind === 'unauthorized') onUnlinked();
        else setError(e instanceof ApiError ? e.message : "Couldn't load the latest data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session, onUnlinked],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  const approve = useCallback(
    async (id: string, label: string) => {
      if (!session) return false;
      // Approvals are sensitive: confirm it's really the owner holding the phone.
      const bio = await getBiometricInfo();
      if (bio.available && !(await authenticate(`Approve: ${label}`))) return false;
      try {
        await api.approve(session, id);
        setApproved((s) => new Set(s).add(id));
        return true;
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Couldn't send the approval.");
        return false;
      }
    },
    [session],
  );

  const value = useMemo(
    () => ({ data, loading, refreshing, error, refresh: () => load('refresh'), approve, approvedIds }),
    [data, loading, refreshing, error, load, approve, approvedIds],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboard must be used inside <DashboardProvider>');
  return ctx;
}
