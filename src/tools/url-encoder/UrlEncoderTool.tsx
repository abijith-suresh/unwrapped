import { createMemo, createSignal } from "solid-js";
import ToolActionButton from "@/components/ToolActionButton";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { useToolHandoff } from "@/components/toolHandoff";
import { EXAMPLE_TEXT } from "@/lib/exampleData";
import { decodeUrlText, encodeUrlText } from "@/lib/urlEncoding";

const ENCODED_EXAMPLE = encodeUrlText(EXAMPLE_TEXT);

export default function UrlEncoderTool() {
  const [mode, setMode] = createSignal<"encode" | "decode">("encode");
  const [input, setInput] = createSignal("");

  const isExample = () => input() === "";
  const exampleInput = () => (mode() === "encode" ? EXAMPLE_TEXT : ENCODED_EXAMPLE);
  const result = createMemo<{ value: string; error: string | null }>(() => {
    if (mode() === "encode") {
      return { value: encodeUrlText(input() || EXAMPLE_TEXT), error: null };
    }
    const decoded = decodeUrlText(input() || ENCODED_EXAMPLE);
    return decoded.ok ? { value: decoded.value, error: null } : { value: "", error: decoded.error };
  });
  const output = () => result().value;
  const error = () => result().error;
  const canSwap = () => !isExample() && !!output();

  function swap() {
    if (!canSwap()) return;
    const current = output();
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setInput(current);
  }

  function clear() {
    setMode("encode");
    setInput("");
  }

  useToolHandoff("url-encoder", (handoff) => {
    setMode("encode");
    setInput(handoff.value);
  });

  return (
    <ToolContainer>
      <ToolToolbar
        label="URL encoding options"
        actions={
          <>
            <ToolActionButton onClick={swap} title="Swap input/output" disabled={!canSwap()}>
              ⇅ Swap
            </ToolActionButton>
            <ToolActionButton onClick={clear} variant="ghost">
              Clear
            </ToolActionButton>
          </>
        }
      >
        <ToolSegmentedControl
          label="Operation"
          hideLabel
          value={mode()}
          onChange={setMode}
          options={[
            { value: "encode", label: "Encode" },
            { value: "decode", label: "Decode" },
          ]}
        />
      </ToolToolbar>
      <ToolTransformWorkspace
        input={{
          compact: true,
          label: mode() === "encode" ? "Plain text" : "Encoded text",
          name: "url-input",
          value: input(),
          onInput: setInput,
          placeholder: exampleInput(),
        }}
        output={{
          download: { format: "text" },
          handoff: "text",
          compact: true,
          title: mode() === "encode" ? "Encoded output" : "Decoded output",
          value: output(),
          error: error() ?? undefined,
          isExample: isExample(),
          copyLabel: "Copy",
        }}
      />
    </ToolContainer>
  );
}
