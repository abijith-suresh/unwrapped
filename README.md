# unwrapped.tools

Browser-only developer utilities for working with text, tokens, configs, URLs, dates, and related
data.

Tool inputs stay in the browser. The app does not upload them or process them on a server. It does
not store tool inputs or outputs. Favorite tool IDs and Diff display preferences are stored in
`localStorage`. Files you choose to download are saved by your browser. There are no accounts, ads,
analytics, or tracking.

Use "Open in…" on a result to send it to a compatible tool in the same tab. Transfers stay in
memory, are consumed once, and disappear on refresh. Tool data is never added to URLs or history.

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
