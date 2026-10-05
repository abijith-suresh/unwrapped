import type { CodeHighlightSegment } from "./codeHighlight";
import { toErrorMessage } from "./text";

export const MAX_REGEX_MATCHES = 10_000;

export type FlagKey = "g" | "i" | "m" | "s";

export interface CaptureGroup {
  number: number;
  value: string | null;
}

export interface NamedCaptureGroup {
  name: string;
  value: string | null;
}

export interface MatchResult {
  index: number;
  fullMatch: string;
  groups: CaptureGroup[];
  /** Named aliases of numbered captures; excluded from captureGroupCount. */
  namedGroups: NamedCaptureGroup[];
}

export interface RegexSummary {
  captureGroupCount: number;
  emptyMatchCount: number;
  firstMatchIndex: number | null;
}

export interface RegexReplaceResult {
  output: string;
  replacements: number;
}

export interface RegexResult {
  matches: MatchResult[];
  highlighted: CodeHighlightSegment[];
  error: string | null;
  summary: RegexSummary;
}

function plainHighlight(input: string): CodeHighlightSegment[] {
  return input ? [{ text: input, kind: "plain" }] : [];
}

export function buildRegexResult(pattern: string, flags: Set<FlagKey>, input: string): RegexResult {
  if (!pattern) {
    return {
      matches: [],
      highlighted: plainHighlight(input),
      error: null,
      summary: createSummary([]),
    };
  }

  let regex: RegExp;
  const flagString = [...flags].join("");

  try {
    regex = new RegExp(pattern, flagString.includes("g") ? flagString : `${flagString}g`);
  } catch (error) {
    return {
      matches: [],
      highlighted: plainHighlight(input),
      error: toErrorMessage(error, "Invalid regular expression"),
      summary: createSummary([]),
    };
  }

  const matches: MatchResult[] = [];
  const ranges: [number, number][] = [];

  for (const match of input.matchAll(regex)) {
    if (matches.length >= MAX_REGEX_MATCHES)
      return {
        matches: [],
        highlighted: plainHighlight(input),
        error: "Too many matches. Narrow the pattern or shorten the test string.",
        summary: createSummary([]),
      };
    const groups: CaptureGroup[] = [];

    // RegExp numbers every capture, including named and unmatched groups.
    // Equal values (or spans) cannot identify which numbered capture has a name.
    for (let index = 1; index < match.length; index++) {
      groups.push({ number: index, value: match[index] ?? null });
    }

    matches.push({
      index: match.index,
      fullMatch: match[0],
      groups,
      namedGroups: Object.entries(match.groups ?? {}).map(([name, value]) => ({
        name,
        value: value ?? null,
      })),
    });
    ranges.push([match.index, match.index + match[0].length]);

    if (!flagString.includes("g")) {
      break;
    }
  }

  const highlighted: CodeHighlightSegment[] = [];
  let position = 0;
  for (const [start, end] of ranges) {
    const beforeMatch = input.slice(position, start);
    const matchText = input.slice(start, end);
    if (beforeMatch) highlighted.push({ text: beforeMatch, kind: "plain" });
    if (matchText) highlighted.push({ text: matchText, kind: "match" });
    position = end;
  }
  const afterMatches = input.slice(position);
  if (afterMatches) highlighted.push({ text: afterMatches, kind: "plain" });

  return { matches, highlighted, error: null, summary: createSummary(matches) };
}

export function buildRegexReplaceResult(
  pattern: string,
  flags: Set<FlagKey>,
  input: string,
  replacement: string
): RegexReplaceResult | { error: string } {
  if (!pattern) {
    return {
      output: input,
      replacements: 0,
    };
  }

  let regex: RegExp;
  const flagString = [...flags].join("");

  try {
    regex = new RegExp(pattern, flagString);
  } catch (error) {
    return {
      error: toErrorMessage(error, "Invalid regular expression"),
    };
  }

  const output = input.replace(regex, replacement);
  const replacements = countReplacements(pattern, flagString, input);

  return {
    output,
    replacements,
  };
}

function createSummary(matches: MatchResult[]): RegexSummary {
  return {
    captureGroupCount: matches.reduce((total, match) => total + match.groups.length, 0),
    emptyMatchCount: matches.filter((match) => match.fullMatch.length === 0).length,
    firstMatchIndex: matches[0]?.index ?? null,
  };
}

function countReplacements(pattern: string, flagString: string, input: string): number {
  const regex = new RegExp(pattern, flagString);

  if (!flagString.includes("g")) {
    return regex.test(input) ? 1 : 0;
  }

  let count = 0;

  for (const _ of input.matchAll(regex)) {
    count += 1;
  }

  return count;
}

export interface RegexAnalysisInput {
  pattern: string;
  flags: FlagKey[];
  input: string;
  replacement: string;
  mode: "match" | "replace";
}

export interface RegexAnalysisResult {
  match: RegexResult;
  replacement: RegexReplaceResult | { error: string };
}

/** Run user patterns in a worker; bundled examples are safe to evaluate directly. */
export function analyzeRegex(input: RegexAnalysisInput): RegexAnalysisResult {
  const flags = new Set(input.flags);
  const match = buildRegexResult(input.pattern, flags, input.input);
  return {
    match,
    replacement: match.error
      ? { error: match.error }
      : input.mode === "replace"
        ? buildRegexReplaceResult(input.pattern, flags, input.input, input.replacement)
        : { output: "", replacements: 0 },
  };
}
