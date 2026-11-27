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

import { useCallback, useState } from 'react';

import { useFocusEffect } from './router';
import { ApiError } from './errors';
import { useSession } from './session';
import type { Session } from './types';

/** Loads a page's data every time it comes into view; `reload` powers pull-to-refresh. */
export function useLoad<T>(fn: (s: Session) => Promise<T>, deps: unknown[]) {
  const { session } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    if (!session) return;
    try {
      setData(await fn(session));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load this page.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, ...deps]);

  useFocusEffect(
    useCallback(() => {
      void run();
    }, [run]),
  );
  return { data, error, loading, reload: run };
}
