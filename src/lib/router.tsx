import { createNavigationContainerRef, StackActions, useFocusEffect, useRoute } from '@react-navigation/native';
import { useEffect } from 'react';

/**
 * Thin expo-router-style API over React Navigation, so screens read `router.push('/scan')`.
 * Paths map to route names: stack screens by name, the five tab screens inside "tabs".
 */
export const navRef = createNavigationContainerRef<Record<string, object | undefined>>();
export { useFocusEffect };

const TABS = ['home', 'servers', 'approvals', 'alerts', 'profile'];
type Params = Record<string, string | undefined>;
export type Href = string | { pathname: string; params?: Params };

function parse(href: Href): { name: string; params?: Params; tab?: string } {
  const { pathname, params } = typeof href === 'string' ? { pathname: href, params: undefined } : href;
  const name = pathname.replace(/^\//, '');
  return TABS.includes(name) ? { name: 'tabs', params: { screen: name }, tab: name } : { name, params };
}

export const router = {
  push: (href: Href) => { const r = parse(href); navRef.isReady() && navRef.dispatch(StackActions.push(r.name, r.params)); },
  replace: (href: Href) => { const r = parse(href); navRef.isReady() && navRef.dispatch(StackActions.replace(r.name, r.params)); },
  navigate: (href: Href) => { const r = parse(href); navRef.isReady() && navRef.navigate(r.name, r.params); },
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
