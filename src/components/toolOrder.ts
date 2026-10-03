import { createSignal, onMount } from "solid-js";

export function useToolRotation() {
  const [rotation, setRotation] = createSignal(0);
  onMount(() => {
    setRotation(Number(document.documentElement.getAttribute("data-tool-rotation") ?? 0));
  });
  return rotation;
}
