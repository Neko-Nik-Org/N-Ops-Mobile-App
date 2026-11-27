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

import { api, ApiError, setSessionRenewedListener } from '../src/lib/api';
import type { Session } from '../src/lib/types';

const session: Session = {
  server: 'https://api.acme.dev',
  userId: 12,
  deviceId: 'dev-1',
  token: 'tok-old',
  refreshToken: 'ref-1',
  user: { firstName: 'Arjun', displayName: 'Arjun Kumar', initials: 'AK' },
  workspace: { name: 'acme', environment: '' },
  linkedAt: '2026-01-01T00:00:00Z',
};

const reply = (status: number, body: unknown) => ({ status, ok: status >= 200 && status < 300, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) }) as Response;
const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
});

describe('api', () => {
  it('profile maps the snake_case reply and sends the session token', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { user_name: 'arjun', primary_email: 'a@acme.dev', is_email_verified: true, organization_name: 'Acme', can_approve_approvals: true }));
    expect(await api.profile(session)).toEqual({ userName: 'arjun', email: 'a@acme.dev', emailVerified: true, organization: 'Acme', canApprove: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.acme.dev/user/self/profile');
    expect(init.headers['x-nops-token']).toBe('tok-old');
  });

  it('renews the session once on a 401, tells the listener, then retries', async () => {
    const renewed = jest.fn();
    setSessionRenewedListener(renewed);
    fetchMock
      .mockResolvedValueOnce(reply(401, { error: 'E1: expired' }))
      .mockResolvedValueOnce(reply(200, { session_id: 'tok-new', data: { user_id: 12, display_name: 'Arjun Kumar', organization_name: 'acme' } }))
      .mockResolvedValueOnce(reply(200, { user_name: 'a', primary_email: 'a@b.c', is_email_verified: false, organization_name: 'x', can_approve_approvals: false }));
    await api.profile(session);
    expect(renewed).toHaveBeenCalledWith({ ...session, token: 'tok-new' });
    expect(fetchMock.mock.calls[2][1].headers['x-nops-token']).toBe('tok-new');
  });

  it('a failed renewal means this phone was unlinked', async () => {
    fetchMock.mockResolvedValue(reply(401, { error: 'E1: no' }));
    await expect(api.profile(session)).rejects.toMatchObject({ kind: 'unauthorized' });
  });

  it('a network failure is a friendly ApiError', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(api.profile(session)).rejects.toBeInstanceOf(ApiError);
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(api.profile(session)).rejects.toMatchObject({ kind: 'network' });
  });

  it('unlink calls the device logout route', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, ''));
    await api.unlink(session);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.acme.dev/auth/device/logout');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });
});
