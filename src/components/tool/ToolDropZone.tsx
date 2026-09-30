import { createSignal, type JSX, Show, splitProps } from "solid-js";

import { cn } from "@/lib/cn";

export interface ToolDropZoneProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "onDragLeave" | "onDragOver" | "onDrop"> {
  onFile: (file: File) => void;
  overlayLabel?: string;
  class?: string;
}

export default function ToolDropZone(props: ToolDropZoneProps) {
  const [local, rest] = splitProps(props, ["onFile", "overlayLabel", "class", "children"]);
  const [dragging, setDragging] = createSignal(false);

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (!dragging()) {
      setDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent) {
    // Only clear when leaving the zone itself, not a child
    const related = event.relatedTarget as Node | null;
    const target = event.currentTarget as HTMLElement;
    if (!related || !target.contains(related)) {
      setDragging(false);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      local.onFile(file);
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: file drop affordance for pointer and keyboard users; the wrapper is intentionally not focusable.
    <div
      {...rest}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      class={cn(
        "relative min-w-0 transition-[border-color] duration-150 motion-reduce:transition-none",
        local.class
      )}
      classList={{ "border-2 border-dashed border-[var(--accent-primary)]": dragging() }}
    >
      <Show when={dragging()}>
        <div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-panel)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-base font-semibold text-[var(--accent-primary)]">
          {local.overlayLabel ?? "Drop file here"}
        </div>
      </Show>
      {local.children}
    </div>
  );
}
