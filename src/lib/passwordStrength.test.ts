import { describe, expect, it } from "vitest";
import { estimatePassword } from "./passwordStrength";

describe("password strength", () => {
  it("recognizes common passwords and keyboard patterns", () => {
    expect(estimatePassword("password")?.score).toBe(0);
    expect(estimatePassword("qwerty123")?.score).toBeLessThan(2);
    expect(estimatePassword("aaaaaaaaaaaa")?.score).toBeLessThan(2);
  });
  it("gives a diverse longer password more search effort", () => {
    expect(estimatePassword("f6!wR9#kL2$vT8@zQ5")?.guessesLog10).toBeGreaterThan(
      estimatePassword("password")?.guessesLog10 ?? 0
    );
  });
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
