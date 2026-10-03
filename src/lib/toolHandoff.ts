import type { TextFormat } from "@/lib/download";
import { getToolRoute, tools } from "@/tools/registry";

export interface ToolHandoff {
  sourceId: string;
  targetId: string;
  value: string;
  format: TextFormat;
}

export function getHandoffTargets(sourceId: string, format: TextFormat) {
  if (!tools.some((tool) => tool.id === sourceId)) return [];
  return tools.filter(
    (tool) =>
      tool.id !== sourceId &&
      (tool.inputFormats?.includes(format) || tool.inputFormats?.includes("text"))
  );
}

/** One short-lived transfer. No URL, history, storage or serialized page state. */
export function createToolHandoffStore() {
  let pending: { handoff: ToolHandoff; lease: symbol; expiresAt: number } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function clear(lease?: symbol) {
    if (lease && pending?.lease !== lease) return;
    clearTimeout(timer);
    pending = undefined;
  }
  return {
    prepare(handoff: ToolHandoff) {
      if (
        !handoff.value ||
        !getHandoffTargets(handoff.sourceId, handoff.format).some(
          (tool) => tool.id === handoff.targetId
        )
      ) {
        throw new Error("This output cannot be opened in that tool.");
      }
      clear();
      const lease = Symbol("tool handoff");
      pending = { handoff: { ...handoff }, lease, expiresAt: Date.now() + 60_000 };
      timer = setTimeout(() => clear(lease), 60_000);
      return lease;
    },
    consume(targetId: string) {
      const handoff = pending && Date.now() < pending.expiresAt ? pending.handoff : undefined;
      clear();
      return handoff?.targetId === targetId ? handoff : undefined;
    },
    discardUnless(targetId: string | undefined) {
      if (pending?.handoff.targetId !== targetId) clear();
    },
    clear,
  };
}

export const toolHandoffs = createToolHandoffStore();
let navigate: ((route: string) => Promise<void>) | undefined;

/** The Astro shell supplies its client router without coupling Solid UI to it. */
export function setToolHandoffNavigator(navigator: (route: string) => Promise<void>) {
  navigate = navigator;
}

export async function openToolHandoff(handoff: ToolHandoff) {
  if (!navigate) throw new Error("Navigation is not ready. Try again.");
  const lease = toolHandoffs.prepare(handoff);
  try {
    const target = tools.find((tool) => tool.id === handoff.targetId);
    if (!target) throw new Error("Tool not found.");
    await navigate(getToolRoute(target.slug));
  } catch (error) {
    toolHandoffs.clear(lease);
    throw error;
  }
}
