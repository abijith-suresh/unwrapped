import type { TextTransformResult } from "@/lib/text";
import { createWorkerExecutor } from "@/lib/workerExecution";

export interface JsonSchemaValidationInput {
  input: string;
  schema: string;
}

/** Includes worker startup, lossless parsing, compilation and validation. */
export const JSON_SCHEMA_TIMEOUT_MS = 5_000;

export function createJsonSchemaExecutor() {
  return createWorkerExecutor<JsonSchemaValidationInput, TextTransformResult>({
    createWorker: () =>
      typeof Worker === "undefined"
        ? null
        : new Worker(new URL("./jsonSchema.worker.ts", import.meta.url), { type: "module" }),
    timeoutMs: JSON_SCHEMA_TIMEOUT_MS,
    timeoutMessage:
      "Validation exceeded the 5-second limit. Simplify the schema or reduce the document and try again.",
    unavailableMessage: "Background validation is unavailable in this browser.",
    errorMessage: "Background validation failed. Edit the inputs and try again.",
  });
}
