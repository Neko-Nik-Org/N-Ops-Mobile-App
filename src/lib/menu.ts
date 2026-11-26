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

import type { IconName } from '@/components/Icon';

export interface MenuItem {
  /** Drawer route name; also the path segment used by router.navigate('/<name>'). */
  name: string;
  title: string;
  icon?: IconName;
  body: string;
}
export interface MenuSection extends MenuItem {
  children?: MenuItem[];
}

/** Mirrors the Admin UI sidebar (APP_SECTIONS), minus Super admin. Keep in sync with it. */
export const MENU: MenuSection[] = [
  { name: 'home', title: 'Overview', icon: 'home', body: 'Fleet health, approvals and recent alerts.' },
  { name: 'servers', title: 'Servers', icon: 'servers', body: 'Your fleet with health, uptime and recent changes for each server.' },
  { name: 'tools', title: 'Tools', icon: 'wrench', body: 'Operational tools for your servers.' },
  {
    name: 'service-management',
    title: 'Service management',
    icon: 'boxes',
    body: '',
    children: [{ name: 'postgres', title: 'Postgres', body: 'Manage your Postgres services.' }],
  },
  { name: 'vault', title: 'Vault', icon: 'lock', body: 'Environment variables, config files and notes per project.' },
  { name: 'approvals', title: 'Approvals', icon: 'shieldCheck', body: 'Review and approve sensitive actions your team requests.' },
  { name: 'metrics', title: 'Metrics', icon: 'lineChart', body: 'Server metrics over time.' },
  { name: 'workflows', title: 'Workflows', icon: 'workflow', body: 'Your workflows and their runs.' },
  { name: 'service-logs', title: 'Service logs', icon: 'scroll', body: 'Logs from your services.' },
  {
    name: 'admin',
    title: 'Admin',
    icon: 'key',
    body: '',
    children: [
      { name: 'organization', title: 'Organization', body: 'Your organization details.' },
      { name: 'users', title: 'Users', body: 'People in your organization.' },
      { name: 'invitations', title: 'Invitations', body: 'Pending and past invitations.' },
      { name: 'api-keys', title: 'API keys', body: 'Keys for programmatic access.' },
      { name: 'roles', title: 'Roles', body: 'Roles and their permissions.' },
      { name: 'access-policies', title: 'Access policies', body: 'Sign-in and security policies.' },
      { name: 'tags', title: 'Tags', body: 'Tags used to group servers.' },
      { name: 'audit-logs', title: 'Audit logs', body: 'Who did what, and when.' },
    ],
  },
];

/** Pages the drawer also hosts that aren't in the Admin UI sidebar. */
export const EXTRA: MenuItem[] = [
  { name: 'alerts', title: 'Alerts', icon: 'bell', body: 'Server alerts, workflow results and Vault changes.' },
  { name: 'profile', title: 'Profile', icon: 'user', body: '' },
];

export const DRAWER_ROUTES = [...MENU.flatMap((s) => s.children ?? [s]), ...EXTRA].map((i) => i.name);
