# unwrapped.tools — agent brief
Browser-only developer utilities for text, tokens, configs, URLs and dates, for developers who will
not send their data to a server.

## The Project
Core promise: a catalog of small developer tools where all parsing, converting and formatting runs
client-side. Tool inputs and outputs never leave the browser and are never persisted.
Non-goals: uploads, server-side processing, beacons, tracking, analytics, telemetry, accounts,
login, sync, ads or collaboration; storing tool inputs or outputs; a second tool catalog outside the
code.
Status: live — shipped at unwrapped.tools, actively adding tools.

## How I Work Here
- Quality gate: `bun run verify` (type-check, lint, format check, build, tests) — run before handoff.
- Commits: Conventional Commits; types live in commitlint.config.ts. Squash merges; never commit to main.
- Work off the latest `main`. Install with `bun install`; run the app with `bun run dev`.
- Hard rule: `src/tools/registry.ts` is the single tool catalog. Add each tool's metadata, route,
  slug, icon, accent and help there — never maintain a second catalog in docs or scripts.
- Keep business logic in `src/lib/` or a tool-local module; components only collect input, render
  state and handle interaction. Read user files through `src/lib/fileImport.ts`.
- Do not save user input or output. A preference that must survive a reload is registered and
  described in `src/lib/localPersistence.ts` and reflected on `/privacy`.
- Keep product and privacy claims in `README.md` and `/privacy` accurate.
- Use `@/` for `src` imports and the existing style tokens for UI.
- `bun run test` runs two Vitest projects: `logic` (Node) and `components` (jsdom). The production
  build validates registry IDs, slugs and component paths.

## Sources of Truth
| Fact | Where |
|---|---|
| Product intent | § The Project (this file) |
| Runtime behavior | code + tests |
| Commands & deps | package.json |
| Commit rules | commitlint.config.ts |
Code and tests are the authority; this file never overrides executable truth.

## Getting Around
- `src/tools/` — one directory per tool plus `registry.ts`, the single catalog for metadata, routes,
  slugs, icons, accents and help text.
- `src/lib/` — shared parsers, formatters, storage and tool logic, with colocated `*.test.ts`.
- `src/components/` — shared UI; `src/components/tool/` is the layout kit (ToolContainer, ToolPanel,
  and the transform/inspector/generator/comparer workspaces).
- `src/pages/` — Astro routes; `src/pages/tools/[slug].astro` renders tool pages from the registry.
- `src/styles/` — design tokens; `shell.css` owns the `--tool-width` layout rail.
- `tests/` — Playwright e2e; `src/test/setup.ts` configures Vitest.
- `CONTRIBUTING.md` — contributor workflow, adding a tool, and test strategy.
