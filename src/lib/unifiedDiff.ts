import { createTwoFilesPatch, FILE_HEADERS_ONLY } from "diff";

export interface UnifiedDiffInput {
  original: string;
  modified: string;
  context?: number;
}

export function createUnifiedDiff({ original, modified, context = 3 }: UnifiedDiffInput): string {
  if (!Number.isSafeInteger(context) || context < 0) {
    throw new RangeError("Context must be a non-negative safe integer.");
  }

  return createTwoFilesPatch("original", "modified", original, modified, undefined, undefined, {
    context,
    headerOptions: FILE_HEADERS_ONLY,
    stripTrailingCr: false,
  });
}
