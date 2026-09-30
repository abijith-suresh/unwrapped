import { normalizeNewlines } from "./text";

export interface TextStatistics {
  characters: number;
  words: number;
  lines: number;
  bytes: number;
}

function countWords(input: string): number {
  const trimmed = input.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/u).length;
}

function countLines(input: string): number {
  if (input.length === 0) {
    return 0;
  }

  return normalizeNewlines(input).split("\n").length;
}

export function analyzeText(input: string): TextStatistics {
  return {
    characters: Array.from(input).length,
    words: countWords(input),
    lines: countLines(input),
    bytes: new TextEncoder().encode(input).length,
  };
}
