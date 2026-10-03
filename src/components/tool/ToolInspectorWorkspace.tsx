import { type JSX, Show } from "solid-js";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import ToolResultList, { type ToolResultField } from "@/components/tool/ToolResultList";

interface Props {
  input: JSX.Element;
  fields?: readonly ToolResultField[];
  isExample?: boolean;
  error?: string | null;
  errorId?: string;
  status?: JSX.Element;
  children?: JSX.Element;
  layout?: "grid" | "rows";
}
export default function ToolInspectorWorkspace(props: Props) {
  return (
    <>
      {props.input}
      {props.status}
      <ToolExampleNotice when={!!props.isExample} />
      <Show
        when={!props.error}
        fallback={
          <ToolStatusMessage id={props.errorId} tone="error">
            {props.error}
          </ToolStatusMessage>
        }
      >
        <Show when={props.fields}>
          <ToolResultList
            fields={props.fields ?? []}
            isExample={props.isExample}
            layout={props.layout}
          />
        </Show>
        {props.children}
      </Show>
    </>
  );
}
