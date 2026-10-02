import { type JSX, splitProps } from "solid-js";
import ToolCodeEditor, { type ToolCodeEditorProps } from "@/components/tool/ToolCodeEditor";
import ToolPanel, {
  TOOL_EDITOR_BODY_CLASSES,
  TOOL_EDITOR_PANEL_CLASSES,
} from "@/components/tool/ToolPanel";

export interface ToolInputPanelProps extends Omit<ToolCodeEditorProps, "class" | "labelClass"> {
  actions?: JSX.Element;
  compact?: boolean;
}

export default function ToolInputPanel(props: ToolInputPanelProps) {
  const [local, editor] = splitProps(props, ["actions", "compact"]);
  return (
    <ToolPanel
      title={props.label}
      aria-label={`${props.label} input panel`}
      actions={local.actions}
      class={local.compact ? "flex min-h-[14rem] flex-col" : TOOL_EDITOR_PANEL_CLASSES}
      bodyClass={TOOL_EDITOR_BODY_CLASSES}
    >
      <ToolCodeEditor {...editor} labelClass="sr-only" />
    </ToolPanel>
  );
}
