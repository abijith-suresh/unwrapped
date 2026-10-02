import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_JSON } from "@/lib/exampleData";
import { formatJson } from "@/lib/jsonFormatter";

type OutputFormat = "two-spaces" | "four-spaces" | "minified";
export default function JsonFormatter() {
  const [input, setInput] = createSignal("");
  const [outputFormat, setOutputFormat] = createSignal<OutputFormat>("two-spaces");
  const [sortKeys, setSortKeys] = createSignal(false);
  const result = createMemo(() =>
    formatJson(
      input() || EXAMPLE_JSON,
      outputFormat() === "four-spaces" ? 4 : 2,
      outputFormat() === "minified",
      sortKeys()
    )
  );
  const diagnostic = () =>
    result().errorPosition === null
      ? null
      : { start: result().errorPosition ?? 0, length: result().errorLength };
  const error = () => {
    const current = result();
    if (!current.error) return undefined;
    return current.errorLine && current.errorColumn
      ? `${current.error} Check line ${current.errorLine}, column ${current.errorColumn}.`
      : current.error;
  };
  return (
    <ToolContainer>
      <ToolToolbar label="Formatting controls">
        <ToolSegmentedControl
          label="Output format"
          value={outputFormat()}
          options={[
            { value: "two-spaces", label: "2 spaces" },
            { value: "four-spaces", label: "4 spaces" },
            { value: "minified", label: "Minified" },
          ]}
          onChange={setOutputFormat}
        />
        <ToolActionButton
          active={sortKeys()}
          variant="toggle"
          onClick={() => setSortKeys((value) => !value)}
        >
          Sort keys A-Z
        </ToolActionButton>
      </ToolToolbar>
      <ToolTransformWorkspace
        input={{
          label: "JSON document",
          name: "json-input",
          value: input(),
          onInput: setInput,
          placeholder: EXAMPLE_JSON,
          diagnostic: diagnostic(),
        }}
        output={{
          title: "Output",
          value: result().raw,
          segments: result().segments,
          isExample: input() === "",
          error: error(),
          copyLabel: "Copy JSON",
        }}
      />
    </ToolContainer>
  );
}
