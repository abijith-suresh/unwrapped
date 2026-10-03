import { createMemo, createSignal } from "solid-js";

import Input from "@/components/primitives/solid/Input";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_XML } from "@/lib/exampleData";
import { formatXml } from "@/lib/xmlFormatter";

export default function XmlFormatterTool() {
  const [input, setInput] = createSignal("");
  const isExample = () => input() === "";
  const [indent, setIndent] = createSignal(2);
  const result = createMemo(() => formatXml(input() || EXAMPLE_XML, { indent: indent() }));
  const output = createMemo(() => {
    const current = result();
    return current.ok ? current.output : "";
  });
  const error = createMemo(() => {
    const current = result();
    return current.ok ? "" : current.error;
  });

  return (
    <ToolContainer>
      <div class="flex flex-col gap-3">
        <Input
          label="Indent"
          name="xml-indent"
          autocomplete="off"
          type="number"
          min={2}
          max={8}
          inputmode="numeric"
          value={String(indent())}
          onInput={(value) => setIndent(Number(value) || 2)}
          class="flex-row items-center gap-3"
          controlClass="!w-20 rounded-lg !px-3 !py-2"
        />
      </div>
      <ToolTransformWorkspace
        input={{
          label: "XML input",
          value: input(),
          onInput: setInput,
          placeholder: EXAMPLE_XML,
          name: "source",
        }}
        output={{
          download: { format: "xml" },
          title: "Formatted XML",
          value: output(),
          isExample: isExample(),
          error: error(),
          copyLabel: "Copy XML",
        }}
      />
    </ToolContainer>
  );
}
