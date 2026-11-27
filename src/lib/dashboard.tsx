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

import { Provider, atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';

import { api } from './api';
import { confirmOwner } from './ownerConfirm';
import { ApiError } from './errors';
import { loadPrefs, savePrefs } from './prefs';
import { useSession } from './session';
import type { Dashboard, Tag } from './types';

/** Shared app data (fleet, approvals, tags). Jotai atoms, scoped to <DashboardProvider> so unlinking drops them. */
const dataAtom = atom<Dashboard | null>(null);
const loadingAtom = atom(true);
const refreshingAtom = atom(false);
const errorAtom = atom<string | null>(null);
/** Runs already decided (approved or rejected) on this phone, hidden until the next load. */
const approvedIdsAtom = atom<ReadonlySet<string>>(new Set<string>());
/** Tags this user can see; null until loaded. */
const tagsAtom = atom<Tag[] | null>(null);
const storedTagIdAtom = atom<number | null>(null);
const prefsReadAtom = atom(false);
/** The tag everything is scoped to; null = all tags. A saved id no longer in the tag list reads as "All tags". */
const selectedTagIdAtom = atom((get) => {
  const id = get(storedTagIdAtom);
  return get(tagsAtom)?.some((t) => t.tagId === id) ? id : null;
});

/** Loads the dashboard and tags, and re-loads when the tag scope changes. Renders nothing. */
function Loader({ onUnlinked }: { onUnlinked: () => void }) {
  const { session } = useSession();
  const tags = useAtomValue(tagsAtom);
  const prefsRead = useAtomValue(prefsReadAtom);
  const selectedTagId = useAtomValue(selectedTagIdAtom);
  const setLoadFn = useSetAtom(loadFnAtom);
  const setTags = useSetAtom(tagsAtom);
  const setStored = useSetAtom(storedTagIdAtom);
  const setPrefsRead = useSetAtom(prefsReadAtom);
  const setData = useSetAtom(dataAtom);
  const setLoading = useSetAtom(loadingAtom);
  const setRefreshing = useSetAtom(refreshingAtom);
  const setError = useSetAtom(errorAtom);

  useEffect(() => {
    void loadPrefs().then((p) => {
      setStored(p.selectedTagId);
      setPrefsRead(true);
    });
  }, [setStored, setPrefsRead]);
  useEffect(() => {
    if (!session) return;
    api.listTags(session).then(setTags, () => setTags([])); // no tags = no scoping, not a blocking error
  }, [session, setTags]);

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
    [session, onUnlinked, selectedTagId, setData, setError, setLoading, setRefreshing],
  );
  useEffect(() => {
    setLoadFn({ run: load });
  }, [load, setLoadFn]);
  useEffect(() => {
    if (prefsRead && tags) void load('initial');
  }, [load, prefsRead, tags]);
  return null;
}
// Wrapped in an object: atom(fn) would make Jotai treat the function as a read-only getter.
const loadFnAtom = atom<{ run: (mode: 'initial' | 'refresh') => Promise<void> }>({ run: async () => undefined });

export function DashboardProvider({ children, onUnlinked }: { children: ReactNode; onUnlinked: () => void }) {
  return (
    <Provider>
      <Loader onUnlinked={onUnlinked} />
      {children}
    </Provider>
  );
}

export function useDashboard() {
  const { session } = useSession();
  const data = useAtomValue(dataAtom);
  const loading = useAtomValue(loadingAtom);
  const refreshing = useAtomValue(refreshingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [approvedIds, setApproved] = useAtom(approvedIdsAtom);
  const tags = useAtomValue(tagsAtom);
  const selectedTagId = useAtomValue(selectedTagIdAtom);
  const setStored = useSetAtom(storedTagIdAtom);
  const { run: load } = useAtomValue(loadFnAtom);

  const setSelectedTagId = useCallback(
    (id: number | null) => {
      setStored(id);
      void savePrefs({ selectedTagId: id });
    },
    [setStored],
  );

  /** Asks for Face ID/PIN first, then approves or rejects. True when it went through. */
  const decide = useCallback(
    async (id: string, label: string, approve: boolean) => {
      if (!session) return false;
      // Approvals are sensitive: confirm it's really the owner holding the phone.
      if (!(await confirmOwner(`${approve ? 'Approve' : 'Reject'}: ${label}`))) return false;
      try {
        await api.decideApproval(session, id, approve);
        setApproved((s) => new Set(s).add(id));
        return true;
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Couldn't send your decision.");
        return false;
      }
    },
    [session, setApproved, setError],
  );

  // Stable object so TopBar and the menu only re-render when something they read changes.
  return useMemo(
    () => ({ data, loading, refreshing, error, refresh: () => load('refresh'), decide, approvedIds, tags, selectedTagId, setSelectedTagId }),
    [data, loading, refreshing, error, load, decide, approvedIds, tags, selectedTagId, setSelectedTagId],
  );
}
