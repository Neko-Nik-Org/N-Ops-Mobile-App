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

export interface SessionUser {
  firstName: string;
  displayName: string;
  initials: string;
}

export interface SessionWorkspace {
  /** e.g. "acme" */
  name: string;
  /** e.g. "production" */
  /** Not provided by the API; empty. */
  environment: string;
}

export interface Session {
  server: string;
  userId: number;
  /** Stable id of this phone, sent as `device_identifier`. */
  deviceId: string;
  /** Session id for `x-nops-token`; lasts 3 hours, renewed with the refresh token. */
  token: string;
  refreshToken: string;
  user: SessionUser;
  workspace: SessionWorkspace;
  linkedAt: string;
}

export interface DeviceInfo {
  identifier: string;
  name: string;
  platform: 'ios' | 'android';
  osVersion: string;
  model: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'success' | 'info';

export interface FleetSummary {
  total: number;
  online: number;
  degraded: number;
  offline: number;
}

export interface ApprovalRequest {
  id: string;
  action: string;
  target: string;
  requestedBy: string;
  requestedAt: string;
  approvalsGiven: number;
  approvalsRequired: number;
}

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  subject: string;
  at: string;
}

export interface Tag {
  tagId: number;
  tagName: string;
  tagDescription: string;
}

export interface Dashboard {
  fleet: FleetSummary;
  approvals: ApprovalRequest[];
  alerts: AlertItem[];
  unreadCount: number;
}
