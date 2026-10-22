import { createMemo, createSignal, For } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolPanel from "@/components/tool/ToolPanel";
import { buildChmodResult, type ChmodPermissions } from "@/lib/chmod";

const SUBJECTS = [
  ["owner", "Owner"],
  ["group", "Group"],
  ["other", "Other"],
] as const satisfies ReadonlyArray<readonly [keyof ChmodPermissions, string]>;

const PERMISSIONS = [
  ["read", "Read"],
  ["write", "Write"],
  ["execute", "Execute"],
] as const;

const DEFAULT_PERMISSIONS: ChmodPermissions = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  other: { read: true, write: false, execute: true },
};

export default function ChmodCalculatorTool() {
  const [permissions, setPermissions] = createSignal<ChmodPermissions>(DEFAULT_PERMISSIONS);
  const result = createMemo(() => buildChmodResult(permissions()));

  function togglePermission(
    subject: keyof ChmodPermissions,
    permission: keyof ChmodPermissions["owner"]
  ) {
    setPermissions((current) => ({
      ...current,
      [subject]: {
        ...current[subject],
        [permission]: !current[subject][permission],
      },
    }));
  }

  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        fields={[
          { label: "Octal mode", value: result().octal, copyLabel: "Copy octal" },
          { label: "Symbolic mode", value: result().symbolic, copyLabel: "Copy symbolic" },
          { label: "Command", value: result().command, copyLabel: "Copy command" },
        ]}
        input={
          <ToolPanel title="Permissions">
            <div class="grid gap-1.5">
              <For each={SUBJECTS}>
                {([subject, label]) => (
                  <div class="grid grid-cols-[minmax(3.5rem,auto)_repeat(3,minmax(0,1fr))] items-center gap-1.5">
                    <span class="text-[var(--fs-label)] font-semibold text-[var(--text-secondary)]">
                      {label}
                    </span>
                    <For each={PERMISSIONS}>
                      {([permission, permissionLabel]) => (
                        <ToolActionButton
                          variant="toggle"
                          active={permissions()[subject][permission]}
                          onClick={() => togglePermission(subject, permission)}
                          aria-label={`${label} ${permissionLabel}`}
                          class="w-full px-2"
                        >
                          {permissionLabel}
                        </ToolActionButton>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
          </ToolPanel>
        }
      />
    </ToolContainer>
  );
}
