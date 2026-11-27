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
  icon: IconName;
}
export interface MenuGroup {
  title?: string;
  items: MenuItem[];
}

/** The side menu from the design. Users, roles, invites and tags stay in the web admin. */
export const MENU: MenuGroup[] = [
  { items: [{ name: 'home', title: 'Home', icon: 'home' }] },
  {
    title: 'Infrastructure',
    items: [
      { name: 'servers', title: 'Servers', icon: 'servers' },
      { name: 'services', title: 'Services', icon: 'database' },
    ],
  },
  {
    title: 'Observe',
    items: [
      { name: 'metrics', title: 'Metrics', icon: 'trend' },
      { name: 'logs', title: 'Service logs', icon: 'lines' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { name: 'workflows', title: 'Workflows', icon: 'flow' },
      { name: 'tools', title: 'Tools', icon: 'wrench' },
      { name: 'approvals', title: 'Approvals', icon: 'shieldCheck' },
    ],
  },
  { title: 'Security', items: [{ name: 'vault', title: 'Vault', icon: 'vaultBox' }] },
];

/** Pages reached from elsewhere (avatar, inbox, a server row), not listed in the menu. */
export const HIDDEN: MenuItem[] = [
  { name: 'server', title: 'Server', icon: 'servers' },
  { name: 'alerts', title: 'Inbox', icon: 'bell' },
  { name: 'profile', title: 'Profile', icon: 'user' },
];

export const DRAWER_ROUTES = [...MENU.flatMap((g) => g.items), ...HIDDEN].map((i) => i.name);
