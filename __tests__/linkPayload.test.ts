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

import { isCompleteCode, normalizeCode, normalizeServer, parseLinkPayload, parseUserId } from '../src/lib/linkPayload';

const qr = (o: object) => JSON.stringify({ type: 'n-ops-device-link', version: 1, api: 'https://api.acme.dev', user_id: 12, device_token: 'abcd1234efgh', ...o });

describe('normalizeServer', () => {
  it('adds https, lowercases the host and drops slashes, query and hash', () => {
    expect(normalizeServer('API.Acme.dev/')).toBe('https://api.acme.dev');
    expect(normalizeServer('https://api.acme.dev/v1//?x=1#y')).toBe('https://api.acme.dev/v1');
  });
  it.each([null, undefined, '', '  ', 'bad host', 'ftp://x.dev'])('rejects %p', (v) => {
    expect(normalizeServer(v)).toBeNull();
  });
});

describe('codes and ids', () => {
  it('strips spaces and caps the code at 64', () => {
    expect(normalizeCode(' ab cd\n12 ')).toBe('abcd12');
    expect(normalizeCode('a'.repeat(80))).toHaveLength(64);
  });
  it('needs 8+ characters', () => {
    expect(isCompleteCode('1234567')).toBe(false);
    expect(isCompleteCode('12345678')).toBe(true);
  });
  it('parses digit-only user ids', () => {
    expect(parseUserId(' 12 ')).toBe(12);
    expect(parseUserId('12a')).toBeNull();
    expect(parseUserId(undefined)).toBeNull();
  });
});

describe('parseLinkPayload', () => {
  it('reads the admin QR', () => {
    expect(parseLinkPayload(qr({}))).toEqual({ userId: 12, code: 'abcd1234efgh', server: 'https://api.acme.dev' });
  });
  it.each([{ type: 'other' }, { version: 2 }, { user_id: 'x' }, { device_token: 'short' }, { api: '' }])('rejects a QR with %p', (o) => {
    expect(parseLinkPayload(qr(o))).toBeNull();
  });
  it('reads the nops:// link, with and without a server', () => {
    expect(parseLinkPayload('nops://link?server=https%3A%2F%2Fapi.acme.dev&user_id=12&code=abcd1234')).toEqual({ userId: 12, code: 'abcd1234', server: 'https://api.acme.dev' });
    expect(parseLinkPayload('nops://link?user_id=12&code=abcd1234')).toEqual({ userId: 12, code: 'abcd1234' });
  });
  it('rejects garbage', () => {
    expect(parseLinkPayload('hello')).toBeNull();
    expect(parseLinkPayload('{not json')).toBeNull();
    expect(parseLinkPayload('nops://link?user_id=12')).toBeNull();
  });
});
