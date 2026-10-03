import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import FavoriteButton from "@/components/FavoriteButton";
import { useFavorites } from "@/components/favorites";
import { useToolRotation } from "@/components/toolOrder";
import { ICON_MAP } from "@/lib/iconMap";
import { searchTools } from "@/lib/toolSearch";
import { getToolRoute } from "@/tools/registry";

export default function ToolSearch() {
  const favorites = useFavorites();
  const rotation = useToolRotation();
  const [query, setQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [focused, setFocused] = createSignal(false);

  let inputRef: HTMLInputElement | undefined;

  const filtered = createMemo(() =>
    searchTools(query(), { favoriteIds: favorites.ids(), rotation: rotation() })
  );
  const resultAnnouncement = createMemo(() => {
    const results = filtered();
    const q = query().trim();
    const count = `${results.length} ${results.length === 1 ? "tool" : "tools"} available`;
    const queryDescription = q ? ` for ${q}` : "";
    const active = results[activeIndex()];
    const activeDescription = active ? ` ${active.name} highlighted.` : "";
    return `${count}${queryDescription}.${activeDescription}`;
  });

  /* Reset selection when results change */
  createEffect(() => {
    filtered();
    setActiveIndex(-1);
  });

  /* Scroll the keyboard-selected row into view */
  createEffect(() => {
    const idx = activeIndex();
    if (idx < 0) return;
    const slug = filtered()[idx]?.slug;
    if (slug) {
      document.getElementById(`lp-tool-${slug}`)?.scrollIntoView({ block: "nearest" });
    }
  });

  onMount(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef?.focus();
    }
  });

  function onKeyDown(e: KeyboardEvent) {
    const count = filtered().length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, count - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;

      case "Home":
        if (count === 0) return;
        e.preventDefault();
        setActiveIndex(0);
        break;

      case "End":
        if (count === 0) return;
        e.preventDefault();
        setActiveIndex(count - 1);
        break;

      case "Enter":
        if (activeIndex() >= 0) {
          e.preventDefault();
          const tool = filtered()[activeIndex()];
          if (tool) window.location.href = getToolRoute(tool.slug);
        }
        break;

      case "Escape":
        setQuery("");
        inputRef?.blur();
        break;
    }
  }

  return (
    <search class="lp">
      {/* ── Search input ── */}
      <div classList={{ "lp-search": true, "lp-search--focused": focused() }}>
        <svg
          class="lp-search-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          class="lp-search-input"
          type="text"
          placeholder="Search tools…"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          autocomplete="off"
          spellcheck={false}
          name="tool-search"
          aria-label="Search tools"
        />

        <Show when={query().length > 0}>
          <button
            type="button"
            class="lp-search-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              inputRef?.focus();
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        </Show>
      </div>
      <p class="sr-only" id="lp-results-status" role="status" aria-live="polite" aria-atomic="true">
        {resultAnnouncement()}
      </p>
      <Show when={filtered().length > 0}>
        <ul class="lp-results" id="lp-results" aria-label="Tool results">
          <For each={filtered()}>
            {(tool, idx) => {
              const Icon = ICON_MAP[tool.icon];
              return (
                <li class="lp-tool-card">
                  <a
                    href={getToolRoute(tool.slug)}
                    classList={{
                      "lp-row": true,
                      "lp-row--active": activeIndex() === idx(),
                    }}
                    id={`lp-tool-${tool.slug}`}
                    onFocus={() => setActiveIndex(idx())}
                    onMouseEnter={() => {
                      setActiveIndex(idx());
                      const link = document.createElement("link");
                      link.rel = "prefetch";
                      link.href = getToolRoute(tool.slug);
                      document.head.appendChild(link);
                      setTimeout(() => link.remove(), 5000);
                    }}
                    onMouseLeave={() => setActiveIndex(-1)}
                  >
                    <span class="lp-row-icon" aria-hidden="true">
                      {Icon ? <Icon size={15} /> : null}
                    </span>
                    <span class="lp-row-name">{tool.name}</span>
                    <span class="lp-row-cat">{tool.category}</span>
                    <span class="lp-row-desc">{tool.description}</span>
                    <span class="lp-row-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                  <FavoriteButton toolId={tool.id} toolName={tool.name} class="lp-card-favorite" />
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
      <Show when={filtered().length === 0}>
        <p class="lp-empty">No matching tools.</p>
      </Show>
    </search>
  );
}
