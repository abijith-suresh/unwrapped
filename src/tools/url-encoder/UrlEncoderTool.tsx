import { createMemo, createSignal } from "solid-js";

import ToolContainer from "@/components/tool/ToolContainer";
import ToolTransformWorkspace from "@/components/tool/ToolTransformWorkspace";
import { EXAMPLE_TEXT } from "@/lib/exampleData";
import { decodeUrlText, encodeUrlText } from "@/lib/urlEncoding";

export default function UrlEncoderTool() {
  const [plainText, setPlainText] = createSignal("");
  const [encodedText, setEncodedText] = createSignal("");

  const isEncodingExample = () => plainText() === "";
  const isDecodingExample = () => encodedText() === "";
  const encodedExample = encodeUrlText(EXAMPLE_TEXT);
  const encodedOutput = createMemo(() => encodeUrlText(plainText() || EXAMPLE_TEXT));
  const decodedOutput = createMemo(() => decodeUrlText(encodedText() || encodedExample));
  const decodedValue = createMemo(() => {
    const current = decodedOutput();
    return current.ok ? current.value : "";
  });
  const decodeError = createMemo(() => {
    const current = decodedOutput();
    return current.ok ? "" : current.error;
  });

  return (
    <ToolContainer>
      <ToolTransformWorkspace
        input={{
          label: "Plain text",
          value: plainText(),
          onInput: setPlainText,
          placeholder: EXAMPLE_TEXT,
          name: "plain-text",
        }}
        output={{
          title: "Encoded output",
          value: encodedOutput(),
          isExample: isEncodingExample(),
          copyLabel: "Copy encoded",
        }}
      />
      <ToolTransformWorkspace
        input={{
          label: "Percent-encoded text",
          value: encodedText(),
          onInput: setEncodedText,
          placeholder: encodedExample,
          name: "percent-encoded-text",
        }}
        output={{
          title: "Decoded output",
          value: decodedValue(),
          isExample: isDecodingExample(),
          error: decodeError(),
          copyLabel: "Copy decoded",
        }}
      />
    </ToolContainer>
  );
}
