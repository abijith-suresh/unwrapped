import { type Language, SUPPORTED_LANGUAGES } from "@/lib/language";

export const DIFF_SESSION_VERSION = 2;

export interface DiffSessionState {
  leftLang: Language;
  rightLang: Language;
  changesOnly: boolean;
}

export const DEFAULT_DIFF_SESSION_STATE: DiffSessionState = {
  leftLang: "text",
  rightLang: "text",
  changesOnly: true,
};

function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as Language);
}

export function isDiffSessionState(value: unknown): value is DiffSessionState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Record<string, unknown>;

  return (
    isLanguage(state.leftLang) &&
    isLanguage(state.rightLang) &&
    typeof state.changesOnly === "boolean"
  );
}

export function shouldPersistDiffSession(state: DiffSessionState): boolean {
  return (
    state.leftLang !== DEFAULT_DIFF_SESSION_STATE.leftLang ||
    state.rightLang !== DEFAULT_DIFF_SESSION_STATE.rightLang ||
    state.changesOnly !== DEFAULT_DIFF_SESSION_STATE.changesOnly
  );
}
