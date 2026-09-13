import { createMemo, createSignal, type JSX, splitProps } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";
import { cn } from "@/lib/cn";

export interface ToolWorkspaceView {
  id: string;
  label: string;
  content: JSX.Element;
}

export interface ToolWorkspaceProps extends JSX.HTMLAttributes<HTMLDivElement> {
  views: readonly ToolWorkspaceView[];
  initialView?: string;
  switcherLabel?: string;
}

export default function ToolWorkspace(props: ToolWorkspaceProps) {
  const [local, rest] = splitProps(props, ["class", "initialView", "switcherLabel", "views"]);
  const [selectedId, setSelectedId] = createSignal(local.initialView ?? local.views[0]?.id ?? "");
  const activeId = createMemo(() => {
    if (local.views.some((view) => view.id === selectedId())) {
      return selectedId();
    }

    return local.views[0]?.id ?? "";
  });

  return (
    <div {...rest} class={cn("flex min-w-0 flex-col gap-3", local.class)}>
      <fieldset class="grid grid-cols-2 gap-1 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)] p-1 md:hidden">
        <legend class="sr-only">{local.switcherLabel ?? "Tool views"}</legend>
        {local.views.map((view) => (
          <ToolActionButton
            active={activeId() === view.id}
            variant="segment"
            aria-controls={`tool-view-${view.id}`}
            onClick={() => setSelectedId(view.id)}
            class="w-full"
          >
            {view.label}
          </ToolActionButton>
        ))}
      </fieldset>

      <div class="grid min-w-0 gap-4 md:grid-cols-2">
        {local.views.map((view) => (
          <div
            id={`tool-view-${view.id}`}
            role="tabpanel"
            aria-label={view.label}
            class="hidden min-w-0 md:block"
            style={{ display: activeId() === view.id ? "block" : undefined }}
          >
            {view.content}
          </div>
        ))}
      </div>
    </div>
  );
}
