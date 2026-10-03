export interface WorkerRequest<Input> {
  requestId: number;
  input: Input;
}

export type WorkerResponse<Result> =
  | { requestId: number; result: Result }
  | { requestId: number; error: string };

export interface WorkerTransport<Input, Result> {
  onmessage: ((event: MessageEvent<WorkerResponse<Result>>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror?: ((event: MessageEvent) => void) | null;
  postMessage: (request: WorkerRequest<Input>) => void;
  terminate: () => void;
}

export class WorkerExecutionError extends Error {
  constructor(
    readonly code: "timeout" | "unavailable" | "failed",
    message: string
  ) {
    super(message);
    this.name = "WorkerExecutionError";
  }
}

interface Options<Input, Result> {
  createWorker: () => WorkerTransport<Input, Result> | null;
  timeoutMs: number;
  timeoutMessage: string;
  unavailableMessage: string;
  errorMessage: string;
}

/** One active job. Cancellation stops CPU work rather than just hiding its result. */
export function createWorkerExecutor<Input, Result>(options: Options<Input, Result>) {
  let worker: WorkerTransport<Input, Result> | null = null;
  let nextId = 0;
  let disposed = false;
  let pending: {
    id: number;
    timer: ReturnType<typeof setTimeout>;
    resolve: (response: { requestId: number; result: Result }) => void;
    reject: (error: Error) => void;
  } | null = null;

  function stopWorker() {
    if (!worker) return;
    worker.onmessage = null;
    worker.onerror = null;
    worker.onmessageerror = null;
    worker.terminate();
    worker = null;
  }

  function fail(error: Error) {
    const job = pending;
    pending = null;
    if (job) clearTimeout(job.timer);
    stopWorker();
    job?.reject(error);
  }

  function cancel() {
    if (pending) fail(new DOMException("Execution cancelled.", "AbortError"));
  }

  return {
    cancel,
    dispose() {
      disposed = true;
      cancel();
      stopWorker();
    },
    execute(input: Input): Promise<{ requestId: number; result: Result }> {
      cancel();
      if (disposed) return Promise.reject(new DOMException("Executor disposed.", "AbortError"));
      if (!worker) {
        try {
          worker = options.createWorker();
        } catch {
          worker = null;
        }
      }
      if (!worker)
        return Promise.reject(new WorkerExecutionError("unavailable", options.unavailableMessage));

      const activeWorker = worker;
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending = {
          id,
          resolve,
          reject,
          timer: setTimeout(() => {
            if (pending?.id === id)
              fail(new WorkerExecutionError("timeout", options.timeoutMessage));
          }, options.timeoutMs),
        };
        activeWorker.onmessage = (event) => {
          if (worker !== activeWorker || pending?.id !== event.data.requestId) return;
          if ("error" in event.data) {
            fail(new WorkerExecutionError("failed", options.errorMessage));
            return;
          }
          const job = pending;
          pending = null;
          clearTimeout(job.timer);
          job.resolve(event.data);
        };
        activeWorker.onerror = (event) => {
          event.preventDefault?.();
          if (worker === activeWorker)
            fail(new WorkerExecutionError("failed", options.errorMessage));
        };
        activeWorker.onmessageerror = () => {
          if (worker === activeWorker)
            fail(new WorkerExecutionError("failed", options.errorMessage));
        };
        try {
          activeWorker.postMessage({ requestId: id, input });
        } catch {
          fail(new WorkerExecutionError("failed", options.errorMessage));
        }
      });
    },
  };
}
