import { analyzeRegex, type RegexAnalysisInput } from "@/lib/regex";
import type { WorkerRequest } from "@/lib/workerExecution";

self.onmessage = (event: MessageEvent<WorkerRequest<RegexAnalysisInput>>) => {
  self.postMessage({ requestId: event.data.requestId, result: analyzeRegex(event.data.input) });
};
