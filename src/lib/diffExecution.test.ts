import { describe, expect, it } from "vitest";

import { createDiffAnalysisExecutor, shouldUseStructuredCompareWorker } from "./diffExecution";

describe("diffExecution", () => {
  it("detects structured inputs that should prefer the worker", () => {
    expect(shouldUseStructuredCompareWorker({ leftLanguage: "json", rightLanguage: "json" })).toBe(
      true
    );
    expect(shouldUseStructuredCompareWorker({ leftLanguage: "yaml", rightLanguage: "yaml" })).toBe(
      true
    );
    expect(shouldUseStructuredCompareWorker({ leftLanguage: "json", rightLanguage: "yaml" })).toBe(
      false
    );
    expect(shouldUseStructuredCompareWorker({ leftLanguage: "text", rightLanguage: "text" })).toBe(
      false
    );
  });

  it("executes synchronously when worker transport is unavailable", async () => {
    const executor = createDiffAnalysisExecutor({
      createWorker: () => null,
      workerThresholdChars: 0,
    });

    await expect(
      executor.execute({
        original: "alpha\nbeta\n",
        modified: "alpha\ngamma\n",
        leftLanguage: "text",
        rightLanguage: "text",
        changesOnly: true,
      })
    ).resolves.toMatchObject({
      mode: "sync",
      requestId: 1,
      result: {
        stats: { added: 1, removed: 1 },
      },
    });
  });

  it("increments and preserves request ids across sequential calls", async () => {
    const executor = createDiffAnalysisExecutor({
      createWorker: () => null,
    });

    const first = await executor.execute({
      original: "a\n",
      modified: "b\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });
    const second = await executor.execute({
      original: "c\n",
      modified: "d\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });

    expect(first.requestId).toBe(1);
    expect(second.requestId).toBe(2);
  });

  it("rejects when synchronous analysis fails", async () => {
    const expectedError = new Error("analysis failed");
    const executor = createDiffAnalysisExecutor({
      createWorker: () => null,
      syncExecutor: () => Promise.reject(expectedError),
      workerThresholdChars: 0,
    });

    await expect(
      executor.execute({
        original: "alpha\n",
        modified: "beta\n",
        leftLanguage: "text",
        rightLanguage: "text",
        changesOnly: true,
      })
    ).rejects.toBe(expectedError);
  });

  it("rejects worker requests when the sync fallback fails", async () => {
    const expectedError = new Error("fallback failed");
    const worker = {
      onerror: null as ((event: ErrorEvent) => void) | null,
      onmessage: null,
      postMessage: () => {},
      terminate: () => {},
    };
    const executor = createDiffAnalysisExecutor({
      createWorker: () => worker,
      syncExecutor: () => Promise.reject(expectedError),
      workerThresholdChars: 0,
    });

    const comparison = executor.execute({
      original: "alpha\n",
      modified: "beta\n",
      leftLanguage: "text",
      rightLanguage: "text",
      changesOnly: true,
    });

    worker.onerror?.(new ErrorEvent("error"));

    await expect(comparison).rejects.toBe(expectedError);
  });
});
