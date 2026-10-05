import { describe, expect, it } from "vitest";
import { estimatePassword } from "./passwordStrength";

describe("password strength", () => {
  it("returns only the estimate, without the secret or matched tokens", () => {
    expect(Object.keys(estimatePassword("test-secret") ?? {})).toEqual([
      "score",
      "guessesLog10",
      "warning",
      "suggestions",
    ]);
  });
  it("handles empty input and refuses oversized input without truncation", () => {
    expect(estimatePassword("")).toBeNull();
    expect(() => estimatePassword("a".repeat(257))).toThrow("256");
  });
});
