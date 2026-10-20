# unwrapped — agent brief
A catalog of small developer utilities that run entirely in the browser, for developers who want
their data to stay on their own machine.

## The Project
Core promise: every tool parses, converts, or formats client-side. Tool inputs and outputs never
leave the browser, are never persisted, and never enter URLs or history.
Non-goals: uploads, server-side processing, tracking, analytics, telemetry, accounts, login, sync,
ads, collaboration, or storing tool inputs and outputs. Do not add a second tool catalog outside
the code.
Status: live — shipped at unwrapped.tools, actively adding tools.

## How I Work Here
- Quality gate: `bun run verify` — pass it before handoff.
- Commits: Conventional Commits; allowed types live in `commitlint.config.ts`. Squash merges; never
  commit to main.
- Branch from the latest `main`; keep each PR focused.
- Add focused tests for what you touched; CI owns the full suite.
- Trap: `src/tools/registry.ts` is the single tool catalog. Add each tool's metadata, route, slug,
  icon, accent and help there — never maintain a second catalog in docs or scripts.
- Trap: read user files through `src/lib/fileImport.ts` so size limits and errors stay consistent.
- Keep parsing and conversion logic in `src/lib/` or a tool-local module; components collect input
  and render state.
- Never save tool inputs or outputs. A preference that must survive a reload is registered and
  described in `src/lib/localPersistence.ts` and reflected on `/privacy`.
- Keep product and privacy claims in `README.md` and `/privacy` accurate.

## Sources of Truth
| Fact | Where |
|---|---|
| Product intent | § The Project (this file) |
| Runtime behavior | code + tests |
| Commands & deps | package.json |
| Commit rules | commitlint.config.ts |
Code and tests are the authority; this file never overrides executable truth.
