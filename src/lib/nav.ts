import { router } from './router';
import type { Href } from './router';

/** Clear the stack and land on `href` (after linking, after unlinking). Back can't return to login. */
export const resetTo = (_router: unknown, href: Href) => router.resetTo(href);
