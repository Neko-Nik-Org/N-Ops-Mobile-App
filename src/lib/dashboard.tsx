/*
 * Copyright (C) 2026 Neko Nik <nikhil@nekonik.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 3 along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from './api';
import { authenticate, getBiometricInfo } from './biometrics';
import { ApiError } from './errors';
import { useSession } from './session';
import { loadPrefs, savePrefs } from './prefs';
import type { Dashboard, Tag } from './types';

interface DashboardContextValue {
  data: Dashboard | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  approve: (id: string, label: string) => Promise<boolean>;
  approvedIds: ReadonlySet<string>;
  /** Tags this user can see; null until loaded. */
  tags: Tag[] | null;
  /** The tag everything is scoped to; null = all tags. */
  selectedTagId: number | null;
  setSelectedTagId: (id: number | null) => void;
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
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [storedTagId, setStoredTagId] = useState<number | null>(null);
  const [prefsRead, setPrefsRead] = useState(false);
  // A saved id that is no longer in the user's tag list reads as "All tags".
  const selectedTagId = tags?.some((t) => t.tagId === storedTagId) ? storedTagId : null;

  useEffect(() => {
    void loadPrefs().then((p) => {
      setStoredTagId(p.selectedTagId);
      setPrefsRead(true);
    });
  }, []);
  useEffect(() => {
    if (!session) return;
    api.listTags(session).then(setTags, () => setTags([])); // no tags = no scoping, not a blocking error
  }, [session]);

  const setSelectedTagId = useCallback((id: number | null) => {
    setStoredTagId(id);
    void savePrefs({ selectedTagId: id });
  }, []);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!session) return;
      if (mode === 'refresh') setRefreshing(true);
      try {
        setData(await api.dashboard(session, selectedTagId));
        setError(null);
      } catch (e) {
        if (e instanceof ApiError && e.kind === 'unauthorized') onUnlinked();
        else setError(e instanceof ApiError ? e.message : "Couldn't load the latest data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [session, onUnlinked, selectedTagId],
  );

  useEffect(() => {
    if (prefsRead && tags) void load('initial');
  }, [load, prefsRead, tags]);

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
    () => ({ data, loading, refreshing, error, refresh: () => load('refresh'), approve, approvedIds, tags, selectedTagId, setSelectedTagId }),
    [data, loading, refreshing, error, load, approve, approvedIds, tags, selectedTagId, setSelectedTagId],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboard must be used inside <DashboardProvider>');
  return ctx;
}
