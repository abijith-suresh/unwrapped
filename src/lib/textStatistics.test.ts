import { describe, expect, it } from "vitest";

import { analyzeText } from "./textStatistics";

describe("analyzeText", () => {
  it("reports zero-like metrics for empty input", () => {
    expect(analyzeText("")).toEqual({
      characters: 0,
      words: 0,
      lines: 0,
      bytes: 0,
    });
  });

  it("counts representative whitespace and multiline input", () => {
    expect(analyzeText("Hello world\nTwo  spaces\n\nlast line")).toEqual({
      characters: 34,
      words: 6,
      lines: 4,
      bytes: 34,
    });
  });

  it("computes byte size from the encoded string for unicode-heavy input", () => {
    expect(analyzeText("héllo 👋\n世界")).toEqual({
      characters: 10,
      words: 3,
      lines: 2,
      bytes: 18,
    });
  });
});
