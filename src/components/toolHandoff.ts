import { onMount } from "solid-js";
import { type ToolHandoff, toolHandoffs } from "@/lib/toolHandoff";

export function useToolHandoff(toolId: string, receive: (handoff: ToolHandoff) => void) {
  onMount(() => {
    const handoff = toolHandoffs.consume(toolId);
    if (handoff) receive(handoff);
  });
}
