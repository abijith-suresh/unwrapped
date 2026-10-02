import { Search, X } from "lucide-solid";
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";

import { ICON_MAP } from "@/lib/iconMap";
import { searchTools } from "@/lib/toolSearch";
import { getToolRoute } from "@/tools/registry";

export default function GlobalToolSearch() {
  const [query, setQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [mac, setMac] = createSignal(false);
  const results = createMemo(() => searchTools(query()));
  let dialog: HTMLDialogElement | undefined;
  let input: HTMLInputElement | undefined;
  let returnFocus: HTMLElement | undefined;
  let outsidePointer = false;

  createEffect(() => {
    results();
    setActiveIndex(0);
  });
  createEffect(() => {
    const tool = results()[activeIndex()];
    if (tool && dialog?.open) {
      dialog.querySelector(`#global-tool-${tool.slug}`)?.scrollIntoView({ block: "nearest" });
    }
  });

  function open() {
    if (!dialog) return;
    if (!dialog.open) {
      returnFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      dialog.showModal();
    }
    input?.focus();
    input?.select();
  }

  function reset() {
    setQuery("");
    setActiveIndex(0);
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }

  onMount(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
    function shortcut(event: KeyboardEvent) {
      if (
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k"
      )
        return;
      const otherDialog = document.querySelector("dialog[open]");
      if (otherDialog && otherDialog !== dialog) return;
      event.preventDefault();
      open();
    }
    document.addEventListener("keydown", shortcut);
    onCleanup(() => document.removeEventListener("keydown", shortcut));
  });

  function onKeyDown(event: KeyboardEvent) {
    if (event.isComposing) return;
    const count = results().length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (count)
        setActiveIndex((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + count) % count);
    } else if (event.key === "Enter" && count) {
      event.preventDefault();
      const tool = results()[activeIndex()];
      dialog?.querySelector<HTMLAnchorElement>(`#global-tool-${tool.slug}`)?.click();
    }
  }

  return (
    <>
      <button
        type="button"
        class="global-search-trigger"
        aria-label="Search tools"
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        title="Search tools"
        onClick={open}
      >
        <Search size={18} aria-hidden="true" />
        <span class="global-search-label">Search</span>
        <kbd>{mac() ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <dialog
        ref={dialog}
        class="global-search-dialog"
        aria-labelledby="global-search-title"
        data-tool-search
        onClose={reset}
        onCancel={(event) => {
          event.preventDefault();
          dialog?.close();
        }}
        onPointerDown={(event) => {
          outsidePointer = event.target === dialog;
        }}
        onPointerUp={(event) => {
          if (outsidePointer && event.target === dialog) dialog?.close();
          outsidePointer = false;
        }}
      >
        <div class="global-search-content">
          <header class="global-search-heading">
            <h2 id="global-search-title">Find a tool</h2>
            <button
              type="button"
              class="global-search-close"
              aria-label="Close search"
              onClick={() => dialog?.close()}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div class="global-search-field">
            <Search size={18} aria-hidden="true" />
            <input
              ref={input}
              type="search"
              aria-label="Search tools"
              placeholder="Search tools…"
              autocomplete="off"
              spellcheck={false}
              value={query()}
              onInput={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {results().length} {results().length === 1 ? "tool" : "tools"} available.{" "}
            {results()[activeIndex()]?.name ? `${results()[activeIndex()].name} highlighted.` : ""}
          </p>
          <ul class="global-search-results" aria-label="Tool results">
            <For each={results()}>
              {(tool, index) => {
                const Icon = ICON_MAP[tool.icon];
                return (
                  <li>
                    <a
                      id={`global-tool-${tool.slug}`}
                      href={getToolRoute(tool.slug)}
                      classList={{
                        "global-search-result": true,
                        "global-search-result-active": index() === activeIndex(),
                      }}
                      onFocus={() => setActiveIndex(index())}
                      onMouseEnter={() => setActiveIndex(index())}
                      onClick={() => dialog?.close()}
                    >
                      <span
                        class="global-search-icon"
                        data-tool-accent={tool.accent}
                        aria-hidden="true"
                      >
                        {Icon ? <Icon size={20} /> : null}
                      </span>
                      <span class="global-search-result-text">
                        <span class="global-search-name">{tool.name}</span>
                        <span class="global-search-description">{tool.description}</span>
                      </span>
                      <span class="global-search-arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </li>
                );
              }}
            </For>
          </ul>
          <Show when={!results().length}>
            <p class="global-search-empty">No matching tools.</p>
          </Show>
        </div>
      </dialog>
    </>
  );
}
