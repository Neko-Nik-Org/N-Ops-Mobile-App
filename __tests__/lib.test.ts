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

import { ApiError, messageOf } from '../src/lib/errors';
import { ago, greeting, hostOf, plural, shortAgo, workspaceLabel } from '../src/lib/format';
import { DRAWER_ROUTES, HIDDEN, MENU } from '../src/lib/menu';

describe('format', () => {
  const now = Date.parse('2026-01-01T12:00:00Z');
  const before = (s: number) => new Date(now - s * 1000).toISOString();
  it('shortAgo steps through now, minutes, hours, days', () => {
    expect(shortAgo(before(20), now)).toBe('now');
    expect(shortAgo(before(4 * 60), now)).toBe('4m');
    expect(shortAgo(before(2 * 3600), now)).toBe('2h');
    expect(shortAgo(before(3 * 86400), now)).toBe('3d');
  });
  it('ago reads "just now" or "<x> ago"', () => {
    expect(ago(before(5), now)).toBe('just now');
    expect(ago(before(120), now)).toBe('2m ago');
  });
  it('greeting follows the hour', () => {
    expect(greeting(new Date(2026, 0, 1, 3))).toBe('Good evening');
    expect(greeting(new Date(2026, 0, 1, 9))).toBe('Good morning');
    expect(greeting(new Date(2026, 0, 1, 14))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 0, 1, 20))).toBe('Good evening');
  });
  it('workspaceLabel, hostOf and plural', () => {
    expect(workspaceLabel({ name: 'acme', environment: 'production' })).toBe('acme · production');
    expect(workspaceLabel({ name: 'acme', environment: '' })).toBe('acme');
    expect(hostOf('https://api.acme.dev')).toBe('api.acme.dev');
    expect(plural(1, 'server')).toBe('1 server');
    expect(plural(3, 'server')).toBe('3 servers');
    expect(plural(2, 'query', 'queries')).toBe('2 queries');
  });
});

describe('errors', () => {
  it('messageOf uses an ApiError message, otherwise a generic one', () => {
    expect(messageOf(new ApiError('network', 'No connection'))).toBe('No connection');
    expect(messageOf(new Error('boom'))).toMatch(/Something went wrong/);
  });
});

describe('menu', () => {
  it('has unique route names covering menu and hidden pages', () => {
    expect(new Set(DRAWER_ROUTES).size).toBe(DRAWER_ROUTES.length);
    expect(DRAWER_ROUTES).toEqual([...MENU.flatMap((g) => g.items), ...HIDDEN].map((i) => i.name));
    expect(DRAWER_ROUTES).toEqual(expect.arrayContaining(['home', 'profile', 'approvals']));
  });
});
