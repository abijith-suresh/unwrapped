import type { RegexAnalysisInput, RegexAnalysisResult } from "@/lib/regex";
import { createWorkerExecutor } from "@/lib/workerExecution";

export function createRegexAnalysisExecutor() {
  return createWorkerExecutor<RegexAnalysisInput, RegexAnalysisResult>({
    createWorker: () =>
      typeof Worker === "undefined"
        ? null
        : new Worker(new URL("./regex.worker.ts", import.meta.url), { type: "module" }),
    timeoutMs: 2_000,
    timeoutMessage:
      "The expression took too long. Simplify the pattern or shorten the test string.",
    unavailableMessage: "Background matching is unavailable in this browser.",
    errorMessage: "Matching could not be completed. Edit the pattern to try again.",
  });
}
