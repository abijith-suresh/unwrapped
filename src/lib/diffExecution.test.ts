import { describe, expect, it } from "vitest";
import {
  createDiffAnalysisExecutor,
  shouldUseDiffWorker,
  shouldUseStructuredCompareWorker,
} from "./diffExecution";

const input = {
  original: "a\n",
  modified: "b\n",
  leftLanguage: "text" as const,
  rightLanguage: "text" as const,
  changesOnly: true,
};

describe("diff execution", () => {
  it("uses workers for matching structured languages, large inputs and many short lines", () => {
    expect(shouldUseStructuredCompareWorker({ leftLanguage: "json", rightLanguage: "json" })).toBe(
      true
    );
    expect(shouldUseStructuredCompareWorker({ leftLanguage: "json", rightLanguage: "yaml" })).toBe(
      false
    );
    expect(shouldUseDiffWorker({ original: "a\n".repeat(250), modified: "b" })).toBe(true);
    expect(shouldUseDiffWorker({ original: "a".repeat(75000), modified: "" })).toBe(true);
  });

  it("keeps small plain-text comparisons available without workers and increments IDs", async () => {
    const executor = createDiffAnalysisExecutor({ createWorker: () => null });
    await expect(executor.execute(input)).resolves.toMatchObject({
      mode: "sync",
      requestId: 1,
      result: { stats: { added: 1, removed: 1 } },
    });
    await expect(executor.execute(input)).resolves.toMatchObject({ requestId: 2 });
    executor.dispose();
  });

  it("rejects worker-sized comparisons instead of retrying expensive work on the main thread", async () => {
    const executor = createDiffAnalysisExecutor({
      createWorker: () => null,
      workerThresholdChars: 0,
    });
    await expect(executor.execute(input)).rejects.toMatchObject({ code: "unavailable" });
    executor.dispose();
  });

  it("does not execute comparisons after disposal", async () => {
    const executor = createDiffAnalysisExecutor();
    executor.dispose();
    await expect(executor.execute(input)).rejects.toMatchObject({ name: "AbortError" });
  });
});
