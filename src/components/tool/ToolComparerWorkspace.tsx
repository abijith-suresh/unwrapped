import type { JSX } from "solid-js";
import ToolSplitPane from "@/components/tool/ToolSplitPane";

interface Props {
  left: JSX.Element;
  right: JSX.Element;
  children: JSX.Element;
}
export default function ToolComparerWorkspace(props: Props) {
  return (
    <>
      <ToolSplitPane>
        {props.left}
        {props.right}
      </ToolSplitPane>
      {props.children}
    </>
  );
}
