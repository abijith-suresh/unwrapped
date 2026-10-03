import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createToolHandoffStore,
  getHandoffTargets,
  openToolHandoff,
  setToolHandoffNavigator,
  type ToolHandoff,
  toolHandoffs,
} from "@/lib/toolHandoff";

const transfer: ToolHandoff = {
  sourceId: "json-formatter",
  targetId: "json-to-yaml",
  value: '\n{"__proto__": "雪", "n": 9007199254740993, "decimal": 1.2300}\n',
  format: "json",
};

describe("explicit tool handoffs", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    toolHandoffs.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("derives compatible destinations from the registry and excludes the source", () => {
    const ids = getHandoffTargets("json-formatter", "json").map((tool) => tool.id);
    expect(ids).toContain("json-to-yaml");
    expect(ids).toContain("hash-generator");
    expect(ids).not.toContain("yaml-to-json");
    expect(ids).not.toContain("json-formatter");
    expect(getHandoffTargets("unknown", "json")).toEqual([]);
    expect(getHandoffTargets("json-to-yaml", "yaml").map((tool) => tool.id)).toContain(
      "yaml-to-json"
    );
  });

  it("transfers exact text once without serialization or numeric conversion", () => {
    const store = createToolHandoffStore();
    store.prepare(transfer);
    expect(store.consume(transfer.targetId)).toEqual(transfer);
    expect(store.consume(transfer.targetId)).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects empty or incompatible transfers", () => {
    const store = createToolHandoffStore();
    for (const change of [
      { value: "" },
      { targetId: "yaml-to-json" },
      { targetId: "unknown" },
      { sourceId: "unknown" },
      { targetId: transfer.sourceId },
    ]) {
      expect(() => store.prepare({ ...transfer, ...change })).toThrow();
    }
    expect(store.consume(transfer.targetId)).toBeUndefined();
  });

  it("discards a transfer consumed by a different destination", () => {
    const store = createToolHandoffStore();
    store.prepare(transfer);
    expect(store.consume("hash-generator")).toBeUndefined();
    expect(store.consume(transfer.targetId)).toBeUndefined();
  });

  it("expires unconsumed transfers and rejects expiry even before the timer runs", () => {
    const store = createToolHandoffStore();
    store.prepare(transfer);
    vi.advanceTimersByTime(60_000);
    expect(store.consume(transfer.targetId)).toBeUndefined();
    store.prepare(transfer);
    vi.setSystemTime(Date.now() + 60_000);
    expect(store.consume(transfer.targetId)).toBeUndefined();
  });

  it("clears transfers when navigating elsewhere but keeps the intended destination", () => {
    const store = createToolHandoffStore();
    store.prepare(transfer);
    store.discardUnless(transfer.targetId);
    expect(store.consume(transfer.targetId)).toEqual(transfer);
    store.prepare(transfer);
    store.discardUnless(undefined);
    expect(store.consume(transfer.targetId)).toBeUndefined();
  });

  it("replaces pending output and prevents an older failure from clearing the new transfer", () => {
    const store = createToolHandoffStore();
    const oldLease = store.prepare(transfer);
    const newer = { ...transfer, value: "new result" };
    store.prepare(newer);
    store.clear(oldLease);
    expect(store.consume(transfer.targetId)).toEqual(newer);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passes only the registered route to navigation", async () => {
    const navigate = vi.fn(async () => {});
    setToolHandoffNavigator(navigate);
    await openToolHandoff(transfer);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/tools/json-to-yaml");
    expect(toolHandoffs.consume(transfer.targetId)).toEqual(transfer);
  });

  it("discards pending data after failed navigation", async () => {
    setToolHandoffNavigator(async () => {
      throw new Error("Navigation failed");
    });
    await expect(openToolHandoff(transfer)).rejects.toThrow("Navigation failed");
    expect(toolHandoffs.consume(transfer.targetId)).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });
});
