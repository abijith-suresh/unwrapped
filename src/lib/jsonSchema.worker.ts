import { validateJsonSchema } from "@/lib/jsonSchema";
import type { JsonSchemaValidationInput } from "@/lib/jsonSchemaExecution";
import type { WorkerRequest } from "@/lib/workerExecution";

self.onmessage = (event: MessageEvent<WorkerRequest<JsonSchemaValidationInput>>) => {
  const { requestId, input } = event.data;
  self.postMessage({ requestId, result: validateJsonSchema(input.input, input.schema) });
};
