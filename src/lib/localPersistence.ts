export const DIFF_SESSION_STORAGE_KEY = "unwrapped-tool-session:diff";
export const FAVORITES_STORAGE_KEY = "unwrapped-preference:favorites";

export interface PersistedPreference {
  key: string;
  description: string;
}

export const PERSISTED_PREFERENCES = [
  { key: FAVORITES_STORAGE_KEY, description: "Favorite tool IDs. No searches, inputs or outputs." },
  {
    key: DIFF_SESSION_STORAGE_KEY,
    description: "Diff view preferences. Left and right language and changes-only mode.",
  },
] as const satisfies readonly PersistedPreference[];
