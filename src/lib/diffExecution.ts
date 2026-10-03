import { createWorkerExecutor, type WorkerTransport } from "@/lib/workerExecution";
import {
  createDiffRows,
  DIFF_CONTEXT,
  filterRowsWithContext,
  getChangeSourceIndices,
  getDiffStats,
} from "./diff";
import type { DiffAnalysisInput, DiffAnalysisResult } from "./diffAnalysis";

export const DIFF_WORKER_THRESHOLD_CHARS = 75_000;
const WORKER_TIMEOUT_MS = 10_000;
const STRUCTURED_COMPARE_LANGUAGES = new Set<
  Pick<DiffAnalysisInput, "leftLanguage">["leftLanguage"]
>(["json", "toml", "yaml", "env"]);

export interface DiffExecutionRequest {
  requestId: number;
  input: DiffAnalysisInput;
}

export interface DiffExecutionResponse {
  requestId: number;
  result: DiffAnalysisResult;
  mode: "sync" | "worker";
}

export interface DiffAnalysisExecutor {
  cancel: () => void;
  dispose: () => void;
  execute: (input: DiffAnalysisInput) => Promise<DiffExecutionResponse>;
}

export interface DiffAnalysisExecutorOptions {
  createWorker?: () => WorkerTransport<DiffAnalysisInput, DiffAnalysisResult> | null;
  workerThresholdChars?: number;
  timeoutMs?: number;
}

export function shouldUseDiffWorker(
  input: Pick<DiffAnalysisInput, "original" | "modified">,
  threshold = DIFF_WORKER_THRESHOLD_CHARS
): boolean {
  return (
    input.original.length + input.modified.length >= threshold ||
    input.original.split("\n").length + input.modified.split("\n").length > 200
  );
}

export function shouldUseStructuredCompareWorker(
  input: Pick<DiffAnalysisInput, "leftLanguage" | "rightLanguage">
): boolean {
  return (
    input.leftLanguage === input.rightLanguage &&
    STRUCTURED_COMPARE_LANGUAGES.has(input.leftLanguage)
  );
}

function analyzePlainTextDiff(input: DiffAnalysisInput): DiffAnalysisResult {
  const rows = createDiffRows(input.original, input.modified);
  const filteredRows = filterRowsWithContext(
    rows,
    input.changesOnly,
    input.context ?? DIFF_CONTEXT
  );
  const stats = getDiffStats(rows);

  return {
    strategy: "text",
    errors: [],
    rows,
    filteredRows,
    stats,
    changeIndices: getChangeSourceIndices(rows),
    isIdentical: stats.added === 0 && stats.removed === 0,
  };
}

function createBrowserWorker(): WorkerTransport<DiffAnalysisInput, DiffAnalysisResult> | null {
  if (typeof Worker === "undefined") {
    return null;
  }

  return new Worker(new URL("./diff.worker.ts", import.meta.url), {
    type: "module",
  });
}

export function createDiffAnalysisExecutor(
  options: DiffAnalysisExecutorOptions = {}
): DiffAnalysisExecutor {
  const workerThresholdChars = options.workerThresholdChars ?? DIFF_WORKER_THRESHOLD_CHARS;
  const executor = createWorkerExecutor<DiffAnalysisInput, DiffAnalysisResult>({
    createWorker: options.createWorker ?? createBrowserWorker,
    timeoutMs: options.timeoutMs ?? WORKER_TIMEOUT_MS,
    timeoutMessage: "The comparison took too long. Try fewer lines or a smaller document.",
    unavailableMessage:
      "Background comparison is unavailable. Try a smaller plain-text comparison.",
    errorMessage: "The comparison could not be completed. Edit an input to try again.",
  });
  let nextRequestId = 0;
  let disposed = false;

  return {
    cancel: executor.cancel,
    dispose() {
      disposed = true;
      executor.dispose();
    },
    async execute(input) {
      executor.cancel();
      if (disposed) throw new DOMException("Executor disposed.", "AbortError");
      const requestId = ++nextRequestId;
      const needsWorker =
        shouldUseStructuredCompareWorker(input) || shouldUseDiffWorker(input, workerThresholdChars);
      if (!needsWorker) return { requestId, result: analyzePlainTextDiff(input), mode: "sync" };
      const response = await executor.execute(input);
      return { requestId, result: response.result, mode: "worker" };
    },
  };
}
