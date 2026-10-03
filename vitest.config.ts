import path from "node:path";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

const domLogicTests = [
  "src/lib/theme.test.ts",
  "src/lib/xmlFormatter.test.ts",
  "src/lib/session.test.ts",
];

export default defineConfig({
  // biome-ignore lint/suspicious/noExplicitAny: solid() plugin type is complex
  plugins: [solid() as any],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    conditions: ["browser", "development"],
  },
  test: {
    projects: [
      {
        test: {
          name: "logic",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: domLogicTests,
        },
      },
      {
        test: {
          name: "components",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/**/*.{test,spec}.tsx", ...domLogicTests],
        },
      },
    ],
  },
});
