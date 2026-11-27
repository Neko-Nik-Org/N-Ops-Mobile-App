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

import { LOCK_MS, MAX_ROUNDS, MAX_TRIES, nextAttempt, weakPinReason } from '../src/lib/pin';

jest.mock('react-native-keychain', () => ({ ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'x' } }));

describe('weakPinReason', () => {
  it.each(['000000', '111111', '123456', '654321', '112233', '121212', '123123', '123321', '696969', '101010', '159753', '012345', '987654'])('refuses %s', (pin) => {
    expect(weakPinReason(pin)).not.toBeNull();
  });
  it.each(['264810', '381920', '502947', '718364'])('accepts %s', (pin) => {
    expect(weakPinReason(pin)).toBeNull();
  });
});

describe('nextAttempt', () => {
  const fresh = { salt: 's', hash: 'h', fails: 0, lockedUntil: 0 };

  it('counts down tries, then waits 5 minutes after the 3rd wrong PIN', () => {
    let rec = fresh;
    const r1 = nextAttempt(rec, false, 1000);
    expect(r1.result).toEqual({ ok: false, reason: 'wrong', triesLeft: 2 });
    const r2 = nextAttempt(r1.rec, false, 2000);
    expect(r2.result).toEqual({ ok: false, reason: 'wrong', triesLeft: 1 });
    const r3 = nextAttempt(r2.rec, false, 3000);
    expect(r3.result).toEqual({ ok: false, reason: 'locked', waitMs: LOCK_MS });
    expect(r3.rec.lockedUntil).toBe(3000 + LOCK_MS);
    rec = r3.rec;
    // still waiting: even the right PIN is refused
    expect(nextAttempt(rec, true, 3000 + LOCK_MS - 1).result).toMatchObject({ reason: 'locked' });
    // after the wait the right PIN works and resets the count
    const ok = nextAttempt(rec, true, 3000 + LOCK_MS);
    expect(ok.result).toEqual({ ok: true });
    expect(ok.rec.fails).toBe(0);
  });

  it('gives 3 more tries after a wait, and unlinks after the last round', () => {
    let rec = fresh;
    let now = 0;
    let last: ReturnType<typeof nextAttempt>['result'] = { ok: true };
    for (let i = 0; i < MAX_TRIES * MAX_ROUNDS; i++) {
      now += LOCK_MS + 1; // always past any wait
      const step = nextAttempt(rec, false, now);
      rec = step.rec;
      last = step.result;
    }
    expect(last).toEqual({ ok: false, reason: 'unlink' });
  });
});
