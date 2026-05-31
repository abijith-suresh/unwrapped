export const DIFF_SESSION_STORAGE_KEY = "unwrapped-tool-session:diff";

export interface LocalPersistenceEntry {
  description: string;
  key: string;
  label: string;
}

export const LOCAL_PERSISTENCE_ENTRIES: LocalPersistenceEntry[] = [
  {
    key: DIFF_SESSION_STORAGE_KEY,
    label: "Diff view preferences",
    description:
      "Stores non-sensitive diff preferences such as language selectors and changes-only mode.",
  },
];

export function clearLocalPersistence(
  storage: Pick<Storage, "removeItem"> | null = typeof localStorage === "undefined"
    ? null
    : localStorage
): void {
  if (!storage) {
    return;
  }

  for (const entry of LOCAL_PERSISTENCE_ENTRIES) {
    try {
      storage.removeItem(entry.key);
    } catch {
      // Ignore storage access failures so clearing stays best-effort.
    }
  }
}
