import { type JSX, Show } from "solid-js";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import ToolResultList, { type ToolResultField } from "@/components/tool/ToolResultList";
import ToolToolbar from "@/components/tool/ToolToolbar";

interface Props {
  configuration: JSX.Element;
  actions?: JSX.Element;
  status?: JSX.Element;
  error?: string;
  isExample?: boolean;
  fields?: readonly ToolResultField[];
  children?: JSX.Element;
}
export default function ToolGeneratorWorkspace(props: Props) {
  return (
    <>
      <ToolToolbar actions={props.actions} label="Generator options">
        {props.configuration}
      </ToolToolbar>
      {props.status}
      <ToolExampleNotice when={!!props.isExample} />
      <Show
        when={!props.error}
        fallback={<ToolStatusMessage tone="error">{props.error}</ToolStatusMessage>}
      >
        <Show when={props.fields}>
          <ToolResultList fields={props.fields ?? []} isExample={props.isExample} layout="rows" />
        </Show>
        {props.children}
      </Show>
    </>
  );
}
