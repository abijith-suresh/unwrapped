export const DIFF_SESSION_STORAGE_KEY = "unwrapped-tool-session:diff";

export interface PersistedPreference {
  key: string;
  description: string;
}

export const PERSISTED_PREFERENCES = [
  {
    key: DIFF_SESSION_STORAGE_KEY,
    description: "Diff view preferences. Left and right language and changes-only mode.",
  },
] as const satisfies readonly PersistedPreference[];
