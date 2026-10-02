import type { ToolAccent } from "@/tools/registry";

const SITE_ACCENTS = [
  "blue",
  "teal",
  "amber",
  "violet",
  "rose",
  "emerald",
  "cyan",
  "orange",
  "magenta",
  "lime",
] as const satisfies readonly ToolAccent[];

export function getThemeBootstrapScript(): string {
  return `(function () {
  const root = document.documentElement;
  root.setAttribute("data-theme", "dark");
  const accents = ${JSON.stringify(SITE_ACCENTS)};
  const accent = root.getAttribute("data-site-accent") || accents[Math.floor(Date.now() / 21600000) % accents.length];
  root.setAttribute("data-site-accent", accent);
  document.addEventListener("astro:before-swap", function (event) {
    event.newDocument.documentElement.setAttribute("data-site-accent", accent);
  });
})();`;
}
