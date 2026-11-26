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

import { config } from './config';
import { ApiError } from './errors';
import type { NotificationPrefs } from './prefs';
import type { Dashboard, DeviceInfo, Session, SessionUser, SessionWorkspace, Tag } from './types';

/**
 * Client for the N-Ops Main API. Linking follows the Admin UI: the web app makes a one-time device
 * token (`POST /user/devices/generate`); `POST /auth/device/login` trades it for a refresh token and
 * `POST /auth/device/refresh` for a 3-hour session id, sent as `x-nops-token`.
 */

export { ApiError } from './errors';

export interface LinkResult {
  userId: number;
  deviceId: string;
  token: string;
  refreshToken: string;
  user: SessionUser;
  workspace: SessionWorkspace;
}

export interface Api {
  linkDevice(server: string, userId: number, code: string, device: DeviceInfo): Promise<LinkResult>;
  bootstrap(session: Session): Promise<Dashboard>;
  /** `tagId` null = all tags. */
  dashboard(session: Session, tagId: number | null): Promise<Dashboard>;
  listTags(session: Session): Promise<Tag[]>;
  approve(session: Session, approvalId: string): Promise<void>;
  registerPush(session: Session, pushToken: string, platform: 'ios' | 'android', prefs: NotificationPrefs): Promise<void>;
  updateNotificationPrefs(session: Session, prefs: NotificationPrefs): Promise<void>;
  unlink(session: Session): Promise<void>;
}

/** Called with the new session after the 3-hour token was renewed, so it can be saved. */
let onRenewed: (s: Session) => void = () => undefined;
export const setSessionRenewedListener = (fn: (s: Session) => void) => {
  onRenewed = fn;
};

/** The API's `{ error: "E221: message" }` JSON, or a short plain-text body, without the code prefix. */
function apiMessage(body: unknown): string | null {
  const text = typeof body === 'string' ? body : (body as { error?: unknown } | null)?.error;
  return typeof text === 'string' && text.trim() && text.length <= 200 ? text.replace(/^E\d+:\s*/, '').trim() : null;
}

async function request<T>(server: string, path: string, init: RequestInit & { token?: string; json?: unknown } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  let res: Response;
  try {
    res = await fetch(`${server}${path}`, {
      ...init,
      body: init.json === undefined ? init.body : JSON.stringify(init.json),
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(init.token ? { 'x-nops-token': init.token } : {}),
      },
    });
  } catch {
    throw new ApiError('network', "Couldn't reach the server. Check your connection and the server address.");
  } finally {
    clearTimeout(timer);
  }

  const raw = await res.text();
  let body: unknown = raw;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    /* plain-text body */
  }
  if (res.ok) return body as T;

  const msg = apiMessage(body);
  if (res.status === 401 || res.status === 404) throw new ApiError('unauthorized', msg ?? 'This phone is no longer linked.');
  if (res.status === 400 || res.status === 403) throw new ApiError('invalid_code', msg ?? "That code didn't work. Check it and try again.");
  throw new ApiError('server', msg ?? 'Something went wrong on the server. Try again in a moment.');
}

interface SessionResponse {
  session_id: string;
  data: { user_id: number; display_name: string; organization_name: string };
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

/** Trades the refresh token for a new session id; the old session id (if any) is ended by the API. */
const refresh = (server: string, userId: number, deviceId: string, refreshToken: string, current: string) =>
  request<SessionResponse>(server, '/auth/device/refresh', {
    method: 'POST',
    json: { user_id: userId, device_identifier: deviceId, refresh_token: refreshToken, current_session_key: current },
  });

let renewing: Promise<Session> | null = null;

/** Runs an authenticated call; on a 401 renews the session once (shared by parallel calls) and retries. */
async function authed<T>(session: Session, path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await request<T>(session.server, path, { ...init, token: session.token });
  } catch (e) {
    if (!(e instanceof ApiError) || e.kind !== 'unauthorized') throw e;
  }
  renewing ??= refresh(session.server, session.userId, session.deviceId, session.refreshToken, session.token)
    .then((r) => {
      const next = { ...session, token: r.session_id };
      onRenewed(next);
      return next;
    })
    .finally(() => {
      renewing = null;
    });
  const next = await renewing; // a failed renewal throws "unauthorized" = this phone was unlinked
  return request<T>(session.server, path, { ...init, token: next.token });
}

// shortcut: the API has no fleet, approvals or alerts routes yet (the Admin UI guesses them too), so the
// dashboard is empty and only proves the session is valid. Replace once those endpoints exist.
const empty: Dashboard = { fleet: { total: 0, online: 0, degraded: 0, offline: 0 }, approvals: [], alerts: [], unreadCount: 0 };
const checkSession = async (s: Session) => {
  await authed<void>(s, '/auth/verify');
  return empty;
};

export const api: Api = {
  async linkDevice(server, userId, code, device) {
    const { refresh_token } = await request<{ refresh_token: string }>(server, '/auth/device/login', {
      method: 'POST',
      json: {
        user_id: userId,
        device_token: code,
        device_name: device.name,
        device_type: device.platform,
        device_identifier: device.identifier,
        device_details: { os_version: device.osVersion, model: device.model },
      },
    });
    const r = await refresh(server, userId, device.identifier, refresh_token, '');
    const name = r.data.display_name;
    return {
      userId,
      deviceId: device.identifier,
      token: r.session_id,
      refreshToken: refresh_token,
      user: { firstName: name.trim().split(/\s+/)[0] ?? name, displayName: name, initials: initialsOf(name) },
      workspace: { name: r.data.organization_name, environment: '' },
    };
  },
  bootstrap: checkSession,
  // shortcut: tagId is accepted but unused until the fleet/approvals/alerts routes exist and can filter by tag.
  dashboard: (s) => checkSession(s),
  async listTags(session) {
    const raw = await authed<Array<{ tag_id: number; tag_name: string; tag_description: string }>>(session, '/tag/list');
    return raw.map((t) => ({ tagId: t.tag_id, tagName: t.tag_name, tagDescription: t.tag_description }));
  },
  async approve() {
    throw new ApiError('server', "Approvals aren't available on this server yet.");
  },
  // shortcut: no push-token or notification-prefs routes in the API yet; prefs stay on the phone.
  async registerPush() {},
  async updateNotificationPrefs() {},
  async unlink(session) {
    await authed<void>(session, '/auth/device/logout', { method: 'DELETE' });
  },
};
