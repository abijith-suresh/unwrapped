import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [solid({ ssr: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
});
