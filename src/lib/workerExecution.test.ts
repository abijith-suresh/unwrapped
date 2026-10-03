import { afterEach, describe, expect, it, vi } from "vitest";
import { createWorkerExecutor, type WorkerTransport } from "./workerExecution";

function setup() {
  vi.useFakeTimers();
  const workers: WorkerTransport<string, string>[] = [];
  const createWorker = vi.fn(() => {
    const worker: WorkerTransport<string, string> = {
      onmessage: null,
      onerror: null,
      postMessage: vi.fn(),
      terminate: vi.fn(),
    };
    workers.push(worker);
    return worker;
  });
  const executor = createWorkerExecutor({
    createWorker,
    timeoutMs: 100,
    timeoutMessage: "Too long",
    unavailableMessage: "Unavailable",
    errorMessage: "Failed",
  });
  const respond = (index: number, requestId: number, result: string) =>
    workers[index].onmessage?.({ data: { requestId, result } } as MessageEvent);
  return { executor, createWorker, workers, respond };
}

afterEach(() => vi.useRealTimers());

describe("worker execution", () => {
  it("terminates replaced work and ignores late events from the old worker", async () => {
    const { executor, workers, respond } = setup();
    const first = executor.execute("old");
    const cancelled = expect(first).rejects.toMatchObject({ name: "AbortError" });
    const lateMessage = workers[0].onmessage;
    const second = executor.execute("new");
    await cancelled;
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    lateMessage?.({ data: { requestId: 1, result: "stale" } } as MessageEvent);
    respond(1, 2, "current");
    await expect(second).resolves.toEqual({ requestId: 2, result: "current" });
    expect(vi.getTimerCount()).toBe(0);
    executor.dispose();
  });

  it("stops a timed out worker and starts a fresh worker for recovery", async () => {
    const { executor, workers, respond } = setup();
    const expired = expect(executor.execute("slow")).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(100);
    await expired;
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    const recovered = executor.execute("fast");
    respond(1, 2, "done");
    await expect(recovered).resolves.toMatchObject({ result: "done" });
    executor.dispose();
  });

  it("disposes pending work without starting any fallback or accepting new jobs", async () => {
    const { executor, createWorker, workers } = setup();
    const cancelled = expect(executor.execute("input")).rejects.toMatchObject({
      name: "AbortError",
    });
    executor.dispose();
    await cancelled;
    await expect(executor.execute("later")).rejects.toMatchObject({ name: "AbortError" });
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    expect(createWorker).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears successful deadlines and reuses the idle worker", async () => {
    const { executor, createWorker, workers, respond } = setup();
    const first = executor.execute("one");
    respond(0, 1, "one");
    await first;
    const second = executor.execute("two");
    respond(0, 2, "two");
    await second;
    await vi.advanceTimersByTimeAsync(200);
    expect(createWorker).toHaveBeenCalledOnce();
    expect(workers[0].terminate).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    executor.dispose();
    expect(workers[0].terminate).toHaveBeenCalledOnce();
  });

  it("does not resolve the active job with an unrelated request ID", async () => {
    const { executor, respond } = setup();
    const result = executor.execute("current");
    respond(0, 99, "wrong");
    expect(vi.getTimerCount()).toBe(1);
    respond(0, 1, "right");
    await expect(result).resolves.toMatchObject({ result: "right" });
    executor.dispose();
  });

  it.each(["error", "messageerror", "postMessage"])(
    "cleans up a %s transport failure",
    async (failure) => {
      const { executor, workers } = setup();
      if (failure === "postMessage") {
        const warm = executor.execute("warm");
        workers[0].onmessage?.({ data: { requestId: 1, result: "ready" } } as MessageEvent);
        await warm;
        vi.mocked(workers[0].postMessage).mockImplementation(() => {
          throw new Error("Cannot clone");
        });
      }
      const rejected = expect(executor.execute("input")).rejects.toMatchObject({ code: "failed" });
      if (failure === "error") workers[0].onerror?.(new Event("error") as ErrorEvent);
      if (failure === "messageerror") workers[0].onmessageerror?.({} as MessageEvent);
      await rejected;
      expect(workers[0].terminate).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    }
  );
});
