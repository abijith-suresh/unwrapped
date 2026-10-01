import { type JSX, splitProps } from "solid-js";

type ToolStatusTone = "muted" | "success" | "warning" | "error";

interface ToolStatusMessageProps extends JSX.HTMLAttributes<HTMLDivElement> {
  tone?: ToolStatusTone;
}

const TONE_STYLES: Record<ToolStatusTone, JSX.CSSProperties> = {
  muted: {
    border: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    color: "var(--text-muted)",
  },
  success: {
    border: "1px solid var(--accent-success)",
    background: "color-mix(in srgb, var(--accent-success) 10%, transparent)",
    color: "var(--accent-success)",
  },
  warning: {
    border: "1px solid color-mix(in srgb, var(--accent-warning) 60%, transparent)",
    background: "color-mix(in srgb, var(--accent-warning) 10%, transparent)",
    color: "var(--accent-warning)",
  },
  error: {
    border: "1px solid var(--accent-error)",
    background: "color-mix(in srgb, var(--accent-error) 10%, transparent)",
    color: "var(--accent-error)",
  },
};

export default function ToolStatusMessage(props: ToolStatusMessageProps) {
  const [local, rest] = splitProps(props, ["children", "style", "tone"]);
  const tone = () => local.tone ?? "muted";
  const style = () => (typeof local.style === "object" && local.style !== null ? local.style : {});

  return (
    <div
      {...rest}
      aria-live={tone() === "error" ? "assertive" : "polite"}
      role={tone() === "error" ? "alert" : "status"}
      style={{
        padding: "0.75rem 1rem",
        "border-radius": "0.5rem",
        "font-size": "0.8125rem",
        ...TONE_STYLES[tone()],
        ...style(),
      }}
    >
      {local.children}
    </div>
  );
}
