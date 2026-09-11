import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { build } from "esbuild";
import { injectManifest } from "workbox-build";

const SERVICE_WORKER_SOURCE = fileURLToPath(new URL("../src/sw.ts", import.meta.url));
const PRECACHE_GLOB_PATTERNS = ["**/*.{css,html,js,png,svg,webmanifest,woff2}"];

export default function pwaIntegration(): AstroIntegration {
  return {
    name: "unwrapped-pwa",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const temporaryDirectory = await mkdtemp(join(tmpdir(), "unwrapped-pwa-"));
        const temporaryWorker = resolve(temporaryDirectory, "sw.js");
        const serviceWorker = resolve(outputDirectory, "sw.js");

        try {
          await build({
            bundle: true,
            define: {
              "process.env.NODE_ENV": JSON.stringify("production"),
            },
            entryPoints: [SERVICE_WORKER_SOURCE],
            format: "iife",
            minify: true,
            outfile: temporaryWorker,
            platform: "browser",
            target: "es2020",
          });

          const result = await injectManifest({
            globDirectory: outputDirectory,
            globPatterns: PRECACHE_GLOB_PATTERNS,
            injectionPoint: "self.__WB_MANIFEST",
            swDest: serviceWorker,
            swSrc: temporaryWorker,
          });

          for (const warning of result.warnings) {
            logger.warn(warning);
          }

          logger.info(`Generated service worker with ${result.count} precached files.`);
        } finally {
          await rm(temporaryDirectory, { force: true, recursive: true });
        }
      },
    },
  };
}
