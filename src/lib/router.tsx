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

import { createNavigationContainerRef, StackActions, useFocusEffect, useRoute } from '@react-navigation/native';
import { useEffect } from 'react';

import { DRAWER_ROUTES } from './menu';

/**
 * Thin expo-router-style API over React Navigation, so screens read `router.push('/scan')`.
 * Paths map to route names: stack screens by name, the drawer screens inside "tabs".
 */
export const navRef = createNavigationContainerRef<Record<string, object | undefined>>();
export { useFocusEffect };

const TABS = DRAWER_ROUTES;
type Params = Record<string, string | undefined>;
export type Href = string | { pathname: string; params?: Params };

function parse(href: Href): { name: string; params?: object; tab?: string } {
  const { pathname, params } = typeof href === 'string' ? { pathname: href, params: undefined } : href;
  const name = pathname.replace(/^\//, '');
  return TABS.includes(name) ? { name: 'tabs', params: { screen: name, params }, tab: name } : { name, params };
}

export const router = {
  push: (href: Href) => { const r = parse(href); navRef.isReady() && navRef.dispatch(StackActions.push(r.name, r.params)); },
  replace: (href: Href) => { const r = parse(href); navRef.isReady() && navRef.dispatch(StackActions.replace(r.name, r.params)); },
  navigate: (href: Href) => { const r = parse(href); navRef.isReady() && (navRef.navigate as (n: string, p?: object) => void)(r.name, r.params); },
  back: () => navRef.isReady() && navRef.goBack(),
  canGoBack: () => navRef.isReady() && navRef.canGoBack(),
  /** Clear the stack and land on `href` (after linking, after unlinking). Back can't return to login. */
  resetTo: (href: Href) => { const r = parse(href); navRef.isReady() && navRef.reset({ index: 0, routes: [{ name: r.name, params: r.params }] }); },
};

export const useRouter = () => router;
export const useLocalSearchParams = <T extends Params>() => (useRoute().params ?? {}) as T;

export function Redirect({ href }: { href: Href }) {
  useEffect(() => router.replace(href), [href]);
  return null;
}
