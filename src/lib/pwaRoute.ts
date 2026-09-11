import { getToolRoute, tools } from "@/tools/registry";

import { LAST_TOOL_ROUTE_STORAGE_KEY } from "./localPersistence";

export { LAST_TOOL_ROUTE_STORAGE_KEY } from "./localPersistence";

const TOOL_ROUTES = tools.map((tool) => getToolRoute(tool.slug));
const TOOL_ROUTE_SET = new Set<string>(TOOL_ROUTES);

function normalizeToolPathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function getRestorableToolRoute(pathname: string | null | undefined): string | null {
  if (typeof pathname !== "string") return null;

  const normalizedPathname = normalizeToolPathname(pathname);
  return TOOL_ROUTE_SET.has(normalizedPathname) ? normalizedPathname : null;
}

export function getStandaloneRouteRecovery(
  pathname: string,
  storedPathname: string | null | undefined,
  isStandalone: boolean
): string | null {
  if (!isStandalone || pathname !== "/") return null;

  return getRestorableToolRoute(storedPathname);
}

export function shouldPersistToolRoute(pathname: string): boolean {
  return getRestorableToolRoute(pathname) !== null;
}

export function getPwaRouteBootstrapScript(): string {
  return `(function () {
  try {
    const storageKey = ${JSON.stringify(LAST_TOOL_ROUTE_STORAGE_KEY)};
    const validRoutes = ${JSON.stringify(TOOL_ROUTES)};
    const normalizePathname = (pathname) =>
      pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

    const persistRoute = () => {
      const pathname = normalizePathname(window.location.pathname);
      if (validRoutes.includes(pathname)) {
        localStorage.setItem(storageKey, pathname);
        return true;
      }

      return false;
    };

    const restoreRoute = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

      if (window.location.pathname !== "/" || !isStandalone) return;

      const storedPathname = localStorage.getItem(storageKey);
      if (validRoutes.includes(storedPathname)) {
        window.location.replace(storedPathname);
      }
    };

    if (!persistRoute()) restoreRoute();

    document.addEventListener("astro:page-load", persistRoute);
  } catch {
    // Ignore storage and browser capability failures during bootstrap.
  }
})();`;
}
