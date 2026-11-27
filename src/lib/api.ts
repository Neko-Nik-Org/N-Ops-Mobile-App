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
import type { Dashboard, DeviceInfo, SecretKey, Server, Session, SessionUser, SessionWorkspace, Tag, VaultProject, Workflow } from './types';

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
  /** Approves or rejects a workflow run that is waiting for a decision. */
  decideApproval(session: Session, runId: string, approve: boolean): Promise<void>;
  listVaultProjects(session: Session): Promise<VaultProject[]>;
  /** Keys live under a project + tag; the API requires `tagId`. */
  listSecrets(session: Session, projectId: number, tagId: number): Promise<SecretKey[]>;
  revealSecret(session: Session, secretId: number, version: number): Promise<string>;
  listWorkflows(session: Session): Promise<Workflow[]>;
  runWorkflow(session: Session, workflowId: number): Promise<void>;
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

type Init = RequestInit & { token?: string; json?: unknown; /** A 404 means "route not built yet", not "unlinked". */ soft?: boolean };

async function request<T>(server: string, path: string, { token, json, soft, ...init }: Init = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  let res: Response;
  try {
    res = await fetch(`${server}${path}`, {
      ...init,
      body: json === undefined ? init.body : JSON.stringify(json),
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'x-nops-token': token } : {}),
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
  if (res.status === 404 && soft) throw new ApiError('not_found', msg ?? 'Not available on this server yet.');
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
async function authed<T>(session: Session, path: string, init: Omit<Init, 'token'> = {}): Promise<T> {
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

/** Like `authed`, but a route the server doesn't have yet gives `fallback` instead of an error. */
const softGet = async <T>(session: Session, path: string, fallback: T): Promise<T> => {
  try {
    return await authed<T>(session, path, { soft: true });
  } catch (e) {
    if (e instanceof ApiError && e.kind === 'not_found') return fallback;
    throw e;
  }
};

/** `GET /dashboard/overview`: the contract the Admin UI's Overview page expects (snake_case). */
interface RawOverview {
  workflow_runs_24h: number;
  workflow_runs_failed: number;
  workflow_runs_waiting: number;
  workflow_run_trend: number[];
  alerts_sent_24h: number;
  alerts_latest_source: string;
  alerts_latest_time: string;
  fleet: Array<{
    server_id: string;
    server_name: string;
    kind: string;
    tag_id: number;
    tag_name: string;
    cpu_percent: number | null;
    memory_percent: number | null;
    status: 'online' | 'offline';
    offline_minutes: number | null;
  }>;
  approvals: Array<{ approval_id: string; code: string; title: string; detail: string; expires_label: string }>;
}

const emptyDashboard: Dashboard = {
  fleet: { total: 0, online: 0, degraded: 0, offline: 0 },
  servers: [],
  approvals: [],
  workflowRuns24h: 0,
  workflowRunsFailed: 0,
  workflowRunsWaiting: 0,
  workflowRunTrend: [],
  alertsSent24h: 0,
  alertsLatestSource: '',
  alertsLatestTime: '',
  unreadCount: 0,
};

// shortcut: "degraded" = online with CPU or memory at 90%+, since the API only reports online/offline. Replace when it sends a health state.
const HOT = 90;

async function overview(session: Session, tagId: number | null): Promise<Dashboard> {
  await authed<void>(session, '/auth/verify'); // a revoked phone must still learn it was unlinked
  const raw = await softGet<RawOverview | null>(session, '/dashboard/overview', null);
  if (!raw) return emptyDashboard;
  const servers: Server[] = raw.fleet
    .filter((f) => tagId === null || f.tag_id === tagId)
    .map((f) => ({
      id: f.server_id,
      name: f.server_name,
      kind: f.kind,
      tagId: f.tag_id,
      tagName: f.tag_name,
      cpuPercent: f.cpu_percent,
      memoryPercent: f.memory_percent,
      status: f.status === 'offline' ? 'offline' : (f.cpu_percent ?? 0) >= HOT || (f.memory_percent ?? 0) >= HOT ? 'degraded' : 'online',
      offlineMinutes: f.offline_minutes,
    }));
  const count = (st: Server['status']) => servers.filter((x) => x.status === st).length;
  return {
    fleet: { total: servers.length, online: count('online'), degraded: count('degraded'), offline: count('offline') },
    servers,
    approvals: raw.approvals.map((a) => ({ id: a.approval_id, code: a.code, action: a.title, target: a.detail, expiresLabel: a.expires_label })),
    workflowRuns24h: raw.workflow_runs_24h,
    workflowRunsFailed: raw.workflow_runs_failed,
    workflowRunsWaiting: raw.workflow_runs_waiting,
    workflowRunTrend: raw.workflow_run_trend,
    alertsSent24h: raw.alerts_sent_24h,
    alertsLatestSource: raw.alerts_latest_source,
    alertsLatestTime: raw.alerts_latest_time,
    unreadCount: 0,
  };
}

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
  bootstrap: (s) => overview(s, null),
  dashboard: overview,
  async listTags(session) {
    const raw = await authed<Array<{ tag_id: number; tag_name: string; tag_description: string }>>(session, '/tag/list');
    return raw.map((t) => ({ tagId: t.tag_id, tagName: t.tag_name, tagDescription: t.tag_description }));
  },
  async decideApproval(session, runId, approve) {
    await authed<void>(session, `/workflow/run/${encodeURIComponent(runId)}/${approve ? 'approve' : 'reject'}`, { method: 'POST', soft: true });
  },
  async listVaultProjects(session) {
    const raw = await authed<Array<{ project_id: number; project_name: string }>>(session, '/vault/project/list?limit=100&offset=0');
    return raw.map((p) => ({ projectId: p.project_id, projectName: p.project_name }));
  },
  async listSecrets(session, projectId, tagId) {
    const r = await authed<{ data: Array<{ secret_id: number; secret_name: string; current_version: number; is_hidden: boolean; updated_at: string }> }>(
      session,
      `/vault/secret/keys/list?project_id=${projectId}&tag_id=${tagId}&limit=100&offset=0`,
    );
    return r.data.map((k) => ({ secretId: k.secret_id, name: k.secret_name, currentVersion: k.current_version, isHidden: k.is_hidden, updatedAt: k.updated_at }));
  },
  async revealSecret(session, secretId, version) {
    const r = await authed<{ secret_value: string }>(session, `/vault/secret/keys/read/${secretId}/${version}`);
    return r.secret_value;
  },
  async listWorkflows(session) {
    // The route the Admin UI plans (`GET /workflow/list`); empty until the server has it.
    const raw = await softGet<
      Array<{ workflow_id: number; tag_id: number; name: string; description: string; enabled: boolean; trigger_kind: string; last_run: { status: string; started_at: string } | null }>
    >(session, '/workflow/list', []);
    return raw.map((w) => ({
      workflowId: w.workflow_id,
      tagId: w.tag_id,
      name: w.name,
      description: w.description,
      enabled: w.enabled,
      triggerKind: w.trigger_kind,
      lastRunStatus: w.last_run?.status ?? null,
      lastRunStartedAt: w.last_run?.started_at ?? null,
    }));
  },
  async runWorkflow(session, workflowId) {
    await authed<void>(session, `/workflow/${workflowId}/run`, { method: 'POST', soft: true });
  },
  // shortcut: no push-token or notification-prefs routes in the API yet; prefs stay on the phone.
  async registerPush() {},
  async updateNotificationPrefs() {},
  async unlink(session) {
    await authed<void>(session, '/auth/device/logout', { method: 'DELETE' });
  },
};
