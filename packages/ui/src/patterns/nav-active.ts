/**
 * Whether `pathname` should treat `href` as the active nav target (exact or prefix).
 * Root `/` matches only exactly to avoid every route appearing active.
 */
export function isNavigationActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
