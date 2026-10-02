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
- `src/components/tool/` contains the shared tool layout kit (ToolContainer, ToolPanel,
  ToolWorkspace, ToolCodeEditor, ToolCodeBlock, ToolDropZone, ToolToolbar, ToolSegmentedControl,
  ToolToast, ToolFilePicker).
- `src/pages/tools/[slug].astro` generates tool pages from registry entries.
- `src/pages/` contains the home, information, privacy, and dynamic tool routes.

## Adding a tool

1. Add the component under `src/tools/<slug>/`.
2. Add one complete entry to `src/tools/registry.ts`, including `width`, `icon` (a lucide name present in
   `src/lib/iconMap.tsx`) and `accent` (one of the hues from `ToolAccent`).
3. Keep parsing, conversion, and other business logic in `src/lib/` or a tool-local module.
4. Build the tool UI on the shared layout kit:
   - Root: `<ToolContainer>` inherits the page width from the registry. Choose
     `narrow|standard|wide|full` in the registry; never hand-roll padding, gap, or max-width.
   - Panels: `ToolPanel` (with `TOOL_EDITOR_PANEL_CLASSES`/`TOOL_EDITOR_BODY_CLASSES` for
     code-editor panels), inputs via `ToolCodeEditor`, output via `ToolCodeBlock`.
   - Side-by-side panes: `ToolWorkspace` with `views`.
   - File input: `ToolFilePicker` + `ToolDropZone`, read files through `src/lib/fileImport.ts`.
   - Text transforms: use `ToolTransformWorkspace` to compose the editor, result panel, responsive
     panels, error relationships, example label, and copy action. Pass values and handlers; keep
     parsing and tool state in the tool. Input and output stay visible on phones and sit side by
     side on larger screens.
   - Custom flows: compose `ToolInputPanel` and `ToolOutputPanel`. Use their action slots for file
     pickers and downloads. `ToolOutputPanel` owns example labeling and copy visibility.
   - Controls: use `ToolToolbar` with its `actions` slot and `ToolSegmentedControl` for mutually
     exclusive choices. Keep the shared keyboard and selected-state behavior.
   - Feedback: `ToolStatusMessage` (or `ToolToast` for transient errors), actions via
     `ToolActionButton`.
   Keep workspace copy specific to the task: errors, limits, and instructions needed to use it.
   Put implementation explanations in docs or Help. Example output needs only the shared label.
   Add tool limits and format notes to the registry's `help` field; the shared header renders them
   in Help. Use `ToolActionButton` for tool actions and keep CopyButton's contextual accessible
   label even when its visible label is short.
5. Add focused tests for new behavior and edge cases.
6. Run `bun run verify`.

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
