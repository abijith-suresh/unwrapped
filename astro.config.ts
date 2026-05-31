import solid from "@astrojs/solid-js";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://unwrapped-tools.vercel.app",
  integrations: [solid()],
  vite: {
    resolve: {
      alias: {
        "@": "/src",
        "lucide-solid": "/node_modules/lucide-solid/dist/source/lucide-solid.jsx",
      },
    },
  },
});
