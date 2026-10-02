import { type JSX, Show, splitProps } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolCodeEditor, { type ToolCodeEditorProps } from "@/components/tool/ToolCodeEditor";
import ToolPanel, {
  TOOL_EDITOR_BODY_CLASSES,
  TOOL_EDITOR_PANEL_CLASSES,
} from "@/components/tool/ToolPanel";
import { formatBytes, type ImportedFileMeta } from "@/lib/fileImport";

export interface ToolInputPanelProps extends Omit<ToolCodeEditorProps, "class" | "labelClass"> {
  actions?: JSX.Element;
  compact?: boolean;
  file?: ImportedFileMeta | null;
  onRemoveFile?: () => void;
}

export default function ToolInputPanel(props: ToolInputPanelProps) {
  const [local, editor] = splitProps(props, ["actions", "compact", "file", "onRemoveFile"]);
  return (
    <ToolPanel
      title={props.label}
      aria-label={`${props.label} input panel`}
      actions={local.actions}
      class={
        local.file
          ? undefined
          : local.compact
            ? "flex min-h-[14rem] flex-col"
            : TOOL_EDITOR_PANEL_CLASSES
      }
      bodyClass={local.file ? undefined : TOOL_EDITOR_BODY_CLASSES}
    >
      <Show when={local.file} fallback={<ToolCodeEditor {...editor} labelClass="sr-only" />}>
        {(file) => (
          <div class="flex min-w-0 items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="m-0 break-all text-sm text-[var(--text-primary)]">{file().name}</p>
              <p class="m-0 mt-1 text-xs text-[var(--text-muted)]">{formatBytes(file().size)}</p>
            </div>
            <ToolActionButton
              onClick={() => local.onRemoveFile?.()}
              aria-label="Remove file"
              variant="ghost"
            >
              Remove
            </ToolActionButton>
          </div>
        )}
      </Show>
    </ToolPanel>
  );
}
