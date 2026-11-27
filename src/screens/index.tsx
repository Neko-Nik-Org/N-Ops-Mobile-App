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

import { useRouter } from '@/lib/router';
import { useEffect, useState } from 'react';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { hasPin } from '@/lib/pin';
import { loadPrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';

/**
 * Splash on every cold start, then:
 *   first launch           → Welcome 1–4
 *   seen welcome, unlinked → Scan QR
 *   linked                 → Unlock with PIN (Face ID first) → Dashboard, or "Make it yours" if setup was never finished
 *   linked without a PIN   → Create a PIN (linked before PINs existed)
 */
export default function SplashRoute() {
  const router = useRouter();
  const { status, session } = useSession();
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (!animDone || status !== 'ready') return;
    void (async () => {
      if (session) return router.replace((await hasPin()) ? '/lock' : '/pin-create');
      const prefs = await loadPrefs();
      router.replace(prefs.onboardingSeen ? '/scan' : '/welcome');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animDone, status]);

  return <AnimatedSplash onDone={() => setAnimDone(true)} />;
}
