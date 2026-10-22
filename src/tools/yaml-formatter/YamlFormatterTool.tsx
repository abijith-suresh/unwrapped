import { createMemo, createSignal } from "solid-js";
import Input from "@/components/primitives/solid/Input";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { useToolHandoff } from "@/components/toolHandoff";
import { EXAMPLE_YAML_FORMAT } from "@/lib/exampleData";
import { formatYaml } from "@/lib/yamlFormatter";

export default function YamlFormatterTool() {
  const [input, setInput] = createSignal("");
  useToolHandoff("yaml-formatter", (handoff) => setInput(handoff.value));
  const isExample = () => input() === "";
  const [indent, setIndent] = createSignal(2);
  const [sortKeys, setSortKeys] = createSignal(false);

  const result = createMemo(() =>
    formatYaml(input() || EXAMPLE_YAML_FORMAT, { indent: indent(), sortKeys: sortKeys() })
  );
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
      <ToolToolbar label="Options">
        <Input
          label="Indent"
          name="yaml-indent"
          autocomplete="off"
          type="number"
          min={2}
          max={8}
          inputmode="numeric"
          value={String(indent())}
          onInput={(value) => setIndent(Number(value) || 2)}
          controlClass="w-[var(--size-numeric-field)]"
        />
        <ToolActionButton
          active={sortKeys()}
          variant="toggle"
          onClick={() => setSortKeys((current) => !current)}
        >
          Sort keys
        </ToolActionButton>
      </ToolToolbar>
      <ToolTransformWorkspace
        input={{
          label: "YAML input",
          value: input(),
          onInput: setInput,
          placeholder: EXAMPLE_YAML_FORMAT,
          name: "source",
        }}
        output={{
          download: { format: "yaml" },
          title: "Formatted YAML",
          value: output(),
          isExample: isExample(),
          error: error(),
          copyLabel: "Copy YAML",
        }}
      />
    </ToolContainer>
  );
}
