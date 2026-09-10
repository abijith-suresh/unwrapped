# unwrapped.tools

Browser-only developer utilities for working with text, tokens, configs, URLs, dates, and related
data.

Tool inputs stay in the browser. The app does not upload them or process them on a server. It does
not store tool inputs or outputs. The diff tool stores only display preferences in one `localStorage`
record. There are no accounts, ads, analytics, or tracking.

## Tools

The app's `/features` page lists the current tools. It also documents the available keyboard
shortcuts.

## Development

```sh
bun install
bun run dev
bun run build
bun run preview
bun run verify
```

See `/privacy` in the app for the storage contract and [CONTRIBUTING.md](CONTRIBUTING.md) for the
project map and development workflow.
