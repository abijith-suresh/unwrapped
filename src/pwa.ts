declare global {
  interface Window {
    __unwrappedPwaRegistered?: boolean;
  }
}

const DEV_SW_RESET_KEY = "__unwrappedDevSwReset";
const SERVICE_WORKER_FILE = "sw.js";
const CACHE_PREFIXES = ["unwrapped-precache-", "unwrapped-runtime-"];

function getAppScopeURL(): URL {
  const scopeURL = new URL(import.meta.env.BASE_URL, window.location.origin);

  if (!scopeURL.pathname.endsWith("/")) {
    scopeURL.pathname += "/";
  }

  return scopeURL;
}

function getAppServiceWorkerURLs(): { scope: URL; script: URL } {
  const scope = getAppScopeURL();
  return {
    scope,
    script: new URL(SERVICE_WORKER_FILE, scope),
  };
}

function isAppServiceWorkerRegistration(
  registration: ServiceWorkerRegistration,
  urls: { scope: URL; script: URL }
): boolean {
  if (registration.scope === urls.scope.href) return true;

  return [registration.active, registration.installing, registration.waiting].some(
    (worker) => worker?.scriptURL === urls.script.href
  );
}

async function resetDevServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const urls = getAppServiceWorkerURLs();
  const registrations = (await navigator.serviceWorker.getRegistrations()).filter((registration) =>
    isAppServiceWorkerRegistration(registration, urls)
  );
  if (!registrations.length) {
    sessionStorage.removeItem(DEV_SW_RESET_KEY);
    return;
  }

  const wasControlled = navigator.serviceWorker.controller?.scriptURL === urls.script.href;

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter((key) => CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
        .map((key) => caches.delete(key))
    );
  }

  if (wasControlled && !sessionStorage.getItem(DEV_SW_RESET_KEY)) {
    sessionStorage.setItem(DEV_SW_RESET_KEY, "true");
    window.location.reload();
    return;
  }

  sessionStorage.removeItem(DEV_SW_RESET_KEY);
}

async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const urls = getAppServiceWorkerURLs();

  try {
    await navigator.serviceWorker.register(urls.script, { scope: urls.scope.pathname });
  } catch (error) {
    // This stays local and does not report anything to a server.
    // biome-ignore lint/suspicious/noConsole: registration failures need a local diagnostic.
    console.warn("[unwrapped] Service worker registration failed", error);
  }
}

if (typeof window !== "undefined" && !window.__unwrappedPwaRegistered) {
  window.__unwrappedPwaRegistered = true;

  if (import.meta.env.DEV) {
    void resetDevServiceWorkers();
  } else {
    void registerServiceWorker();
  }
}
