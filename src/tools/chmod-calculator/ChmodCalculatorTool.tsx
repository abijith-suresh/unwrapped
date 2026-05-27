import { createMemo, createSignal, For } from "solid-js";

import CopyButton from "@/components/CopyButton";
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
    <div class="tool-container">
      <section
        style={{
          overflow: "auto",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          "border-radius": "0.75rem",
        }}
      >
        <table style={{ width: "100%", "border-collapse": "collapse" }}>
          <thead>
            <tr>
              <th class="tool-label" style={{ padding: "0.75rem 1rem", "text-align": "left" }}>
                Scope
              </th>
              <For each={PERMISSIONS}>
                {([_, label]) => (
                  <th class="tool-label" style={{ padding: "0.75rem 1rem", "text-align": "left" }}>
                    {label}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={SUBJECTS}>
              {([subject, label]) => (
                <tr>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-primary)" }}>{label}</td>
                  <For each={PERMISSIONS}>
                    {([permission]) => (
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <input
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
      </section>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <section
          style={{
            padding: "1rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.75rem",
          }}
        >
          <div style={{ display: "flex", "justify-content": "space-between", gap: "0.75rem" }}>
            <span class="tool-label">Octal mode</span>
            <CopyButton text={result().octal} label="Copy octal" />
          </div>
          <strong style={{ color: "var(--text-primary)", "font-size": "1.5rem" }}>
            {result().octal}
          </strong>
        </section>

        <section
          style={{
            padding: "1rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.75rem",
          }}
        >
          <div style={{ display: "flex", "justify-content": "space-between", gap: "0.75rem" }}>
            <span class="tool-label">Symbolic mode</span>
            <CopyButton text={result().symbolic} label="Copy symbolic" />
          </div>
          <strong style={{ color: "var(--text-primary)", "font-size": "1.5rem" }}>
            {result().symbolic}
          </strong>
        </section>

        <section
          style={{
            padding: "1rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.75rem",
          }}
        >
          <div style={{ display: "flex", "justify-content": "space-between", gap: "0.75rem" }}>
            <span class="tool-label">Command</span>
            <CopyButton text={result().command} label="Copy command" />
          </div>
          <code style={{ color: "var(--text-primary)", "font-size": "0.95rem" }}>
            {result().command}
          </code>
        </section>
      </div>
    </div>
  );
}
