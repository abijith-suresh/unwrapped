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
  ToolCodeEditor, ToolCodeBlock, ToolDropZone, ToolToolbar, ToolSegmentedControl and
  ToolFilePicker) and the composed transform, inspector, generator and comparer workspaces.
- `src/pages/tools/[slug].astro` generates tool pages from registry entries.
- `src/pages/` contains the home, information, privacy, and dynamic tool routes.

## Adding a tool

1. Add the component under `src/tools/<slug>/`.
2. Add one complete entry to `src/tools/registry.ts`, including `icon` (a lucide name present in
   `src/lib/iconMap.tsx`) and `accent` (one of the hues from `ToolAccent`).
3. Keep parsing, conversion, and other business logic in `src/lib/` or a tool-local module.
4. Build the tool UI on the shared layout kit:
   - Root: `<ToolContainer>` shares the header and footer width through the `--tool-width`
     token in `src/styles/shell.css`. Every tool uses the same 70rem maximum and responsive
     padding. Keep tool-specific layouts inside that rail; never hand-roll page padding, gap,
     or max-width.
   - Panels: `ToolPanel` (with `TOOL_EDITOR_PANEL_CLASSES`/`TOOL_EDITOR_BODY_CLASSES` for
     code-editor panels), inputs via `ToolCodeEditor`, output via `ToolCodeBlock`.
   - Side-by-side panes: `ToolSplitPane` keeps both panes visible at every screen size.
   - File input: `ToolFilePicker` + `ToolDropZone`, read files through `src/lib/fileImport.ts`.
   - Text transforms: use `ToolTransformWorkspace` to compose the editor, result panel, responsive
     panels, error relationships, example label, and copy action. Pass `input` and `output` props; keep
     parsing and tool state in the tool. Input and output stay visible on phones and sit side by
     side on larger screens.
   - Inspectors: `ToolInspectorWorkspace` takes an `input` slot, result `fields`, and optional
     `error`/`status`. It owns example labeling and hides stale results on errors. Keep domain-specific
     tables, highlighted matches and other rich results in its children slot.
   - Generators: `ToolGeneratorWorkspace` takes `configuration`, `actions`, and result `fields` or
     custom children. It shares the toolbar, result cards, example labeling and error display.
   - Comparers: `ToolComparerWorkspace` takes `left` and `right` input slots and result children.
     Both inputs remain visible on phones; the result may be a diff table or validation report.
   - Result fields: `ToolResultList` owns result panels and contextual copy actions. Use `metric`
     for numeric statistics and `copy: false` for results that should not be copied.
   - File input and custom output: use `ToolInputPanel` and `ToolOutputPanel` action slots for file
     pickers and downloads. Output panels also offer "Open in…" for real successful results.
     Declare destination `inputFormats` in the registry and consume transfers with `useToolHandoff`.
     Set output format through `download.format` or `handoff`; use `handoff: false` for binary output.
     Keep parsing, async work and request cancellation outside layouts.
   - Controls: use `ToolToolbar` with its `actions` slot and `ToolSegmentedControl` for mutually
     exclusive choices. Keep the shared keyboard and selected-state behavior.
   - Feedback: `ToolStatusMessage`; actions: `ToolActionButton`.
   Keep workspace copy specific to the task: errors, limits, and instructions needed to use it.
   Put implementation explanations in docs or Help. Example output needs only the shared label.
   Add tool limits and format notes to the registry's `help` field; the shared header renders them
   in Help. Use `ToolActionButton` for tool actions and keep CopyButton's contextual accessible
   label even when its visible label is short.
5. Add focused tests for new behavior and edge cases.
6. Run `bun run verify`.

The dynamic route already handles registered tools. Do not add a separate page for each tool or a
second tool list in documentation.

## Test strategy

`bun run test` runs two [Vitest projects](https://vitest.dev/guide/projects):

- `logic` runs parsers, conversions, generators, validation and execution policies in Node.
- `components` uses jsdom for shared component behavior and tool integrations. XML, theme bootstrap
  and browser preference tests also use this environment because they need browser APIs.

Keep most cases around observable behavior in libraries: exact results, malformed input, numeric
precision, preservation of user data, round trips, format limits and asynchronous failure handling.
Test shared workspace examples, errors, copy visibility and control keyboard behavior once in the
component tests. Keep tool integration tests when they cover behavior beyond those shared contracts:
file reads/downloads, mode transitions, stale asynchronous results, secret handling, or safe rendering
of untrusted markup. Do not repeat heading, panel and placeholder assertions for every transform.

jsdom cannot verify layout or browser hydration. For changes to shared UI, inspect the built app in
real browsers at phone and desktop widths and exercise the affected user flows. Record the browsers,
flows and limitations in the PR. Avoid DOM snapshots and tests that assert utility class names.

## Privacy and storage

- Tool inputs and outputs stay in the browser and must not be uploaded or server-processed.
- Use `src/lib/fileImport.ts` for file reads so size limits and errors stay consistent.
- Do not save user input or output. If a preference must survive a reload, register it in
  `src/lib/localPersistence.ts` and update `/privacy`.

## Git workflow

Create a branch from the latest `main`. Keep each PR focused. Use a Conventional Commit type such
as `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`, or `build`.
