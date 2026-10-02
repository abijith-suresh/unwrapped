import { createMemo, createSignal, For } from "solid-js";

import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
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
          <Card class="overflow-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left">
                    <Label>Scope</Label>
                  </th>
                  <For each={PERMISSIONS}>
                    {([_, label]) => (
                      <th class="px-4 py-3 text-left">
                        <Label>{label}</Label>
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={SUBJECTS}>
                  {([subject, label]) => (
                    <tr>
                      <td class="px-4 py-3 text-[var(--text-primary)]">{label}</td>
                      <For each={PERMISSIONS}>
                        {([permission]) => (
                          <td class="px-4 py-3">
                            <input
                              aria-label={`${label} ${permission}`}
                              name={`chmod-${subject}-${permission}`}
                              type="checkbox"
                              checked={permissions()[subject][permission]}
                              onChange={() => togglePermission(subject, permission)}
                            />
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Card>
        }
      />
    </ToolContainer>
  );
}
