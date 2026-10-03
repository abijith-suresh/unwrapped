import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { minifyCss } from "@/lib/cssMinifier";
import { EXAMPLE_CSS } from "@/lib/exampleData";

export default function Tool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";

  const result = createMemo(() => minifyCss(input() || EXAMPLE_CSS));
  const output = () => {
    const current = result();
    return current.ok ? current.output : "";
  };
  const error = () => {
    const current = result();
    return current.ok ? "" : current.error;
  };
  return (
    <ToolContainer>
      <ToolToolbar label="Options">
        <ToolActionButton onClick={() => setInput("")}>Clear input</ToolActionButton>
      </ToolToolbar>

      <ToolTransformWorkspace
        input={{
          label: "Source",
          value: input(),
          onInput: setInput,
          placeholder: EXAMPLE_CSS,
          name: "source",
        }}
        output={{
          download: { format: "css" },
          title: "Output",
          value: output(),
          isExample: isExample(),
          error: error(),
          copyLabel: "Copy output",
        }}
      />
    </ToolContainer>
  );
}
