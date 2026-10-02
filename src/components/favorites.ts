import { createSignal, onCleanup, onMount } from "solid-js";
import { normalizeFavorites, toggleFavorite } from "@/lib/favorites";
import { FAVORITES_STORAGE_KEY } from "@/lib/localPersistence";
import { loadSessionState, saveSessionState } from "@/lib/session";

const [ids, setIds] = createSignal<string[]>([]);
let initialized = false;
let subscribers = 0;

function read() {
  setIds(
    normalizeFavorites(
      loadSessionState({
        key: FAVORITES_STORAGE_KEY,
        version: 1,
        isData: (value): value is unknown[] => Array.isArray(value),
      })
    )
  );
}
function storageChanged(event: StorageEvent) {
  if (event.key === FAVORITES_STORAGE_KEY || event.key === null) read();
}

export function useFavorites() {
  onMount(() => {
    if (!initialized) {
      read();
      initialized = true;
    }
    if (subscribers++ === 0) window.addEventListener("storage", storageChanged);
    onCleanup(() => {
      if (--subscribers === 0) window.removeEventListener("storage", storageChanged);
    });
  });
  return {
    ids,
    contains: (id: string) => ids().includes(id),
    toggle(id: string) {
      const next = toggleFavorite(ids(), id);
      setIds(next);
      saveSessionState({ key: FAVORITES_STORAGE_KEY, version: 1, data: next });
    },
  };
}
