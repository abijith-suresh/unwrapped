import { createMemo, createSignal, type JSX, splitProps } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";
import ToolSplitPane from "@/components/tool/ToolSplitPane";
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

function handleTabKeyDown(event: KeyboardEvent) {
  const tablist = event.currentTarget as HTMLDivElement;
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const currentIndex = tabs.indexOf(tablist.ownerDocument.activeElement as HTMLButtonElement);

  if (currentIndex === -1) {
    return;
  }

  const nextIndex =
    event.key === "ArrowRight" || event.key === "ArrowDown"
      ? (currentIndex + 1) % tabs.length
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? (currentIndex - 1 + tabs.length) % tabs.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : -1;

  if (nextIndex === -1) {
    return;
  }

  event.preventDefault();
  const nextTab = tabs[nextIndex];
  nextTab?.focus();
  nextTab?.click();
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
      <div
        role="tablist"
        aria-label={local.switcherLabel ?? "Tool views"}
        aria-orientation="horizontal"
        onKeyDown={handleTabKeyDown}
        class="grid grid-cols-2 gap-1 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)] p-1 lg:hidden"
      >
        {local.views.map((view) => (
          <ToolActionButton
            id={`tool-tab-${view.id}`}
            active={activeId() === view.id}
            variant="segment"
            role="tab"
            aria-selected={activeId() === view.id}
            aria-controls={`tool-view-${view.id}`}
            onClick={() => setSelectedId(view.id)}
            class="w-full"
          >
            {view.label}
          </ToolActionButton>
        ))}
      </div>

      <ToolSplitPane>
        {local.views.map((view) => (
          <div
            id={`tool-view-${view.id}`}
            role="tabpanel"
            aria-labelledby={`tool-tab-${view.id}`}
            class="hidden min-w-0 lg:block"
            style={{ display: activeId() === view.id ? "block" : undefined }}
          >
            {view.content}
          </div>
        ))}
      </ToolSplitPane>
    </div>
  );
}
