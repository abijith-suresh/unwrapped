import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { getToolRoute, tools } from "../tools/registry";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../..");
const distDir = resolve(repoRoot, ".astro-test-dist");

function readBuiltFile(filePath: string): string {
  const absolutePath = resolve(distDir, filePath);
  expect(existsSync(absolutePath)).toBe(true);
  return readFileSync(absolutePath, "utf8");
}

beforeAll(() => {
  rmSync(distDir, { force: true, recursive: true });

  execFileSync("bunx", ["astro", "build", "--outDir", distDir], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}, 30000);

describe("PWA route smoke", () => {
  it("builds the home route with the manifest and every registered tool link", () => {
    const html = readBuiltFile("index.html");

    expect(html).toContain("unwrapped.tools");
    expect(html).toContain("/manifest.webmanifest");

    for (const tool of tools) {
      expect(html).toContain(getToolRoute(tool.slug));
    }
  });

  for (const tool of tools) {
    it(`builds ${getToolRoute(tool.slug)}`, () => {
      const html = readBuiltFile(`tools/${tool.slug}/index.html`);

      expect(html).toContain(tool.name);
      expect(html).toContain(tool.description);
      expect(html).toContain("/manifest.webmanifest");
    });
  }

  it("emits the manifest with the declared install icons", () => {
    const manifest = readBuiltFile("manifest.webmanifest");

    expect(manifest).toContain('"start_url":"/"');
    expect(manifest).toContain('"src":"/icon-192.png"');
    expect(manifest).toContain('"src":"/icon-512.png"');
    expect(existsSync(resolve(distDir, "icon-192.png"))).toBe(true);
    expect(existsSync(resolve(distDir, "icon-512.png"))).toBe(true);
  });

  it("precaches the home route and every registered tool route", () => {
    const serviceWorker = readBuiltFile("sw.js");

    expect(serviceWorker).toMatch(/"url":\s*"\/"/);
    expect(serviceWorker).toContain("ignoreURLParametersMatching");

    for (const tool of tools) {
      const route = getToolRoute(tool.slug).slice(1);
      expect(serviceWorker).toMatch(new RegExp(`"url":\\s*"${route}/index\\.html"`));
      expect(serviceWorker).toMatch(new RegExp(`"url":\\s*"${route}"`));
    }
  });
});
