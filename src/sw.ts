/// <reference lib="webworker" />

import { setCacheNameDetails } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { revision: string | null; url: string }>;
};

setCacheNameDetails({ prefix: "unwrapped" });
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST, {
  cleanURLs: true,
  directoryIndex: "index.html",
  ignoreURLParametersMatching: [/.*/],
  urlManipulation: ({ url }) => {
    if (url.pathname === "/" || url.pathname.endsWith("/")) return [];

    const directoryURL = new URL(url);
    directoryURL.pathname = `${directoryURL.pathname}/index.html`;
    directoryURL.search = "";
    directoryURL.hash = "";
    return [directoryURL];
  },
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});
