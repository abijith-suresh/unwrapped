export type CodeHighlightKind =
  | "plain"
  | "json-key"
  | "json-string"
  | "json-number"
  | "json-boolean"
  | "json-null"
  | "match";

export interface CodeHighlightSegment {
  text: string;
  kind: CodeHighlightKind;
}
