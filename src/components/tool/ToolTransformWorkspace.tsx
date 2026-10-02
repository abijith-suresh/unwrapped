import { createUniqueId } from "solid-js";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolOutputPanel from "@/components/tool/ToolOutputPanel";
import ToolSplitPane from "@/components/tool/ToolSplitPane";

export interface ToolTransformWorkspaceProps {
  inputLabel: string;
  value: string;
  placeholder: string;
  onInput: (value: string) => void;
  inputName?: string;
  outputLabel?: string;
  output: string;
  isExample: boolean;
  error?: string;
  errorId?: string;
  copyLabel?: string;
}

/** Standard text conversion layout; parsing and state remain in the tool. */
export default function ToolTransformWorkspace(props: ToolTransformWorkspaceProps) {
  const generatedErrorId = createUniqueId();
  const errorId = () => props.errorId ?? generatedErrorId;
  return (
    <ToolSplitPane>
      <ToolInputPanel
        label={props.inputLabel}
        name={props.inputName ?? "source"}
        value={props.value}
        onInput={props.onInput}
        placeholder={props.placeholder}
        spellcheck={false}
        autocomplete="off"
        error={!!props.error}
        describedBy={props.error ? errorId() : undefined}
      />
      <ToolOutputPanel
        title={props.outputLabel ?? "Output"}
        value={props.output}
        isExample={props.isExample}
        error={props.error}
        errorId={errorId()}
        copyLabel={props.copyLabel}
      />
    </ToolSplitPane>
  );
}
