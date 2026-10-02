import { createUniqueId } from "solid-js";
import ToolInputPanel, { type ToolInputPanelProps } from "@/components/tool/ToolInputPanel";
import ToolOutputPanel, { type ToolOutputPanelProps } from "@/components/tool/ToolOutputPanel";
import ToolSplitPane from "@/components/tool/ToolSplitPane";

interface Props {
  input: ToolInputPanelProps;
  output: ToolOutputPanelProps;
}
/** Tool state and parsing remain outside the shared workspace. */
export default function ToolTransformWorkspace(props: Props) {
  const id = createUniqueId();
  const errorId = () => props.output.errorId ?? id;
  return (
    <ToolSplitPane>
      <ToolInputPanel
        {...props.input}
        error={props.input.error || !!props.output.error}
        describedBy={props.output.error ? errorId() : props.input.describedBy}
      />
      <ToolOutputPanel {...props.output} errorId={errorId()} />
    </ToolSplitPane>
  );
}
