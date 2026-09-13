import type { Component } from "solid-js";
import { createResource, ErrorBoundary, Show } from "solid-js";
import { Dynamic, isServer } from "solid-js/web";

import ToolErrorFallback from "@/components/ToolErrorFallback";

interface ToolHostProps {
  componentPath: string;
  toolName: string;
  loadModule?: (componentPath: string) => Promise<Component>;
}

const toolModules = import.meta.glob<{ default: Component }>("../tools/*/*.tsx");

function loadToolModule(componentPath: string): Promise<Component> {
  const modulePath = `../${componentPath.slice(5)}`;
  const loadTool = toolModules[modulePath];
  if (!loadTool) {
    return Promise.reject(new Error(`Missing tool component loader for ${componentPath}`));
  }
  return loadTool().then((module) => module.default);
}

function ToolSkeleton() {
  return (
    <div
      class="mx-auto flex w-full max-w-[70rem] flex-col gap-5 p-4 sm:p-6"
      role="status"
      aria-label="Loading tool"
    >
      <div class="h-12 w-full rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)] animate-pulse" />
      <div class="grid min-w-0 gap-4 lg:grid-cols-2">
        <div class="h-[26rem] rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)] animate-pulse" />
        <div class="h-[26rem] rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--bg-secondary)] animate-pulse" />
      </div>
    </div>
  );
}

export default function ToolHost(props: ToolHostProps) {
  if (isServer) {
    return <ToolSkeleton />;
  }

  const [toolComponent, { refetch }] = createResource(
    () => props.componentPath,
    (path) => (props.loadModule ?? loadToolModule)(path)
  );

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ToolErrorFallback
          toolName={props.toolName}
          error={error}
          onRetry={() => {
            refetch();
            reset();
          }}
        />
      )}
    >
      <Show
        when={!toolComponent.error}
        fallback={
          <ToolErrorFallback
            toolName={props.toolName}
            error={toolComponent.error}
            onRetry={() => refetch()}
          />
        }
      >
        <Show when={toolComponent()} fallback={<ToolSkeleton />}>
          {(Component) => <Dynamic component={Component()} />}
        </Show>
      </Show>
    </ErrorBoundary>
  );
}
