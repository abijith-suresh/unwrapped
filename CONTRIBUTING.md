# Contributing

## Start here

Install Bun dependencies, start the dev server, and run the full check before opening a PR.

```sh
bun install
bun run dev
bun run verify
```

Use `bun run format` to format files.

## Project map

- `src/tools/registry.ts` is the tool catalog and route source.
- `src/tools/` contains tool-specific UI.
- `src/lib/` contains shared behavior and data handling.
- `src/components/` contains shared UI and error boundaries.
- `src/pages/tools/[slug].astro` generates tool pages from registry entries.
- `src/pages/` contains the home, information, privacy, and dynamic tool routes.

## Adding a tool

1. Add the component under `src/tools/<slug>/`.
2. Add one complete entry to `src/tools/registry.ts`.
3. Keep parsing, conversion, and other business logic in `src/lib/` or a tool-local module.
4. Add focused tests for new behavior and edge cases.
5. Run `bun run verify`.

The dynamic route already handles registered tools. Do not add a separate page for each tool or a
second tool list in documentation.

## Privacy and storage

- Tool inputs and outputs stay in the browser and must not be uploaded or server-processed.
- Use `src/lib/fileImport.ts` for file reads so size limits and errors stay consistent.
- Do not save user input or output. If a preference must survive a reload, register it in
  `src/lib/localPersistence.ts` and update `/privacy`.

## Git workflow

Create a branch from the latest `main`. Keep each PR focused. Use a Conventional Commit type such
as `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`, or `build`.
