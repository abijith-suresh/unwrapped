export type TextTransformResult<TOutput extends string = "output"> = TOutput extends "output"
  ?
      | {
          ok: true;
          output: string;
        }
      | {
          ok: false;
          error: string;
        }
  :
      | {
          ok: true;
          value: string;
        }
      | {
          ok: false;
          error: string;
        };

export function clampIndentSize(indent: number, fallback = 2, min = 2, max = 8): number {
  return Math.min(max, Math.max(min, Math.trunc(indent) || fallback));
}

export function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
