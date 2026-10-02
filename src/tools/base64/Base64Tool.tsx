import { createMemo, createSignal, Show } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolDropZone from "@/components/tool/ToolDropZone";
import ToolFilePicker from "@/components/tool/ToolFilePicker";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolOutputPanel from "@/components/tool/ToolOutputPanel";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import ToolToolbar from "@/components/tool/ToolToolbar";
import {
  type Base64Mode,
  type Base64Variant,
  type Base64Workflow,
  encodeBytesToBase64,
  formatBase64FileNotice,
  processBase64Input,
} from "@/lib/base64";
import { EXAMPLE_TEXT } from "@/lib/exampleData";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  type FileImportError,
  formatImportedFileSummary,
  formatImportSizeLimitMessage,
  type ImportedFileMeta,
  readImportedFile,
} from "@/lib/fileImport";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Base64Tool() {
  const [mode, setMode] = createSignal<Base64Mode>("encode");
  const [variant, setVariant] = createSignal<Base64Variant>("standard");
  const [workflow, setWorkflow] = createSignal<Base64Workflow>("text");
  const [input, setInput] = createSignal("");
  const [fileError, setFileError] = createSignal<FileImportError | null>(null);
  const [loadedFile, setLoadedFile] = createSignal<ImportedFileMeta | null>(null);
  const [loadedFileBytes, setLoadedFileBytes] = createSignal<Uint8Array | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);

  const isExample = () => workflow() === "text" && input() === "" && !loadedFile() && !fileError();
  const exampleInput = createMemo(() =>
    mode() === "encode"
      ? EXAMPLE_TEXT
      : encodeBytesToBase64(new TextEncoder().encode(EXAMPLE_TEXT), variant())
  );
  const textInput = createMemo(() =>
    isExample() ? exampleInput() : mode() === "encode" && workflow() === "file" ? "" : input()
  );
  const result = createMemo(() => {
    if (mode() === "encode" && workflow() === "file" && loadedFileBytes()) {
      return {
        ok: true as const,
        value: encodeBytesToBase64(loadedFileBytes() ?? new Uint8Array(), variant()),
        outputKind: "text" as const,
      };
    }

    return processBase64Input(textInput(), mode(), variant(), workflow(), {
      sourceName: loadedFile()?.name,
    });
  });
  const outputValue = createMemo(() => {
    const current = result();
    return current.ok ? current.value : "";
  });
  const transformError = createMemo(() => {
    const current = result();
    return current.ok ? null : current.error;
  });
  const binaryOutput = createMemo(() => {
    const current = result();
    return current.ok && current.outputKind === "bytes" ? current : null;
  });
  const fileSummary = createMemo(() => {
    const file = loadedFile();
    if (!file) {
      return "";
    }

    return formatImportedFileSummary(file);
  });

  function swap() {
    if (isExample()) return;
    const current = outputValue();
    setFileError(null);
    setFileNotice(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setInput(current);
  }

  function reset() {
    setMode("encode");
    setVariant("standard");
    setWorkflow("text");
    setInput("");
    setFileError(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileNotice(null);
  }

  function handleModeChange(nextMode: Base64Mode) {
    setMode(nextMode);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileError(null);
    setFileNotice(null);
  }

  function handleWorkflowChange(nextWorkflow: Base64Workflow) {
    setWorkflow(nextWorkflow);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileError(null);
    setFileNotice(null);
  }

  async function handleFile(file: File) {
    setFileError(null);
    setFileNotice(null);

    if (mode() === "encode") {
      const result = await readImportedFile(file, {
        as: "bytes",
        policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
      });

      if (!result.ok) {
        setFileError(result.error);
        return;
      }

      if (result.decision.status === "warn") {
        setFileNotice(formatBase64FileNotice(result.file, mode(), workflow()));
      }

      setLoadedFile(result.file);
      setLoadedFileBytes(result.value);
      setWorkflow("file");
      setInput("");
      return;
    }

    const result = await readImportedFile(file, {
      as: "text",
      policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
    });

    if (!result.ok) {
      setFileError(result.error);
      return;
    }

    if (result.decision.status === "warn") {
      setFileNotice(formatBase64FileNotice(result.file, mode(), workflow()));
    }

    setLoadedFile(result.file);
    setLoadedFileBytes(null);
    setInput(result.value);
  }

  function downloadDecodedBytes() {
    const current = result();
    if (!current.ok || current.outputKind !== "bytes" || current.bytes.length === 0) {
      return;
    }

    const blob = new Blob([current.bytes as unknown as BlobPart], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = current.downloadName;
    link.click();
    URL.revokeObjectURL(url);
  }

  const fileReadErrorMessage = () => {
    const error = fileError();
    if (error?.code !== "read-failed") {
      return null;
    }

    return `${error.file.name} could not be read. ${error.message}.`;
  };

  return (
    <ToolContainer>
      <ToolToolbar
        label="Base64 options"
        actions={
          <>
            <ToolActionButton onClick={swap} title="Swap input/output" disabled={isExample()}>
              ⇅ Swap
            </ToolActionButton>
            <ToolActionButton onClick={reset} variant="ghost">
              Reset
            </ToolActionButton>
          </>
        }
      >
        <ToolSegmentedControl
          label="Operation"
          hideLabel
          value={mode()}
          onChange={handleModeChange}
          options={[
            { value: "encode", label: "Encode" },
            { value: "decode", label: "Decode" },
          ]}
        />
        <ToolSegmentedControl
          label="Alphabet"
          hideLabel
          value={variant()}
          onChange={setVariant}
          options={[
            { value: "standard", label: "Base64" },
            { value: "url", label: "Base64url" },
          ]}
        />
        <ToolSegmentedControl
          label="Input type"
          hideLabel
          value={workflow()}
          onChange={handleWorkflowChange}
          options={[
            { value: "text", label: "Text" },
            { value: "file", label: "File / binary" },
          ]}
        />
      </ToolToolbar>
      <ToolDropZone onFile={(file) => void handleFile(file)}>
        <ToolInputPanel
          compact
          label={
            mode() === "encode"
              ? workflow() === "text"
                ? "Plain text"
                : "Binary file"
              : variant() === "url"
                ? "Base64url"
                : "Base64"
          }
          name="base64-input"
          autocomplete="off"
          spellcheck={false}
          value={mode() === "encode" && workflow() === "file" ? fileSummary() : input()}
          onInput={(value) => {
            setFileError(null);
            setFileNotice(null);
            setLoadedFile(null);
            setLoadedFileBytes(null);
            setInput(value);
          }}
          placeholder={
            mode() === "encode" && workflow() === "file"
              ? "Drop or open a file to encode it as Base64…"
              : exampleInput()
          }
          rows={8}
          readonly={mode() === "encode" && workflow() === "file"}
          error={!!transformError()}
          describedBy={transformError() ? "base64-error" : undefined}
          actions={<ToolFilePicker onFileChange={(file) => void handleFile(file)} />}
        />
      </ToolDropZone>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Show when={fileNotice()}>
        <ToolStatusMessage tone="warning">{fileNotice()}</ToolStatusMessage>
      </Show>
      <Show when={fileError()?.code === "file-too-large"}>
        <ToolStatusMessage tone="error">
          {formatImportSizeLimitMessage(DEFAULT_IMPORT_MAX_BYTES)}
        </ToolStatusMessage>
      </Show>
      <Show when={fileError()?.code === "read-failed"}>
        <ToolStatusMessage tone="error">{fileReadErrorMessage()}</ToolStatusMessage>
      </Show>
      <Show when={transformError()}>
        <ToolStatusMessage id="base64-error" tone="error">
          {transformError()}
        </ToolStatusMessage>
      </Show>

      <Show when={outputValue()}>
        <ToolOutputPanel
          compact
          title={
            mode() === "encode"
              ? variant() === "url"
                ? "Base64url"
                : "Base64"
              : workflow() === "file"
                ? "Decoded bytes"
                : "Decoded text"
          }
          value={outputValue()}
          isExample={isExample()}
          copyLabel="Copy"
          actions={
            binaryOutput() ? (
              <ToolActionButton onClick={downloadDecodedBytes}>Download file</ToolActionButton>
            ) : undefined
          }
        />
      </Show>
    </ToolContainer>
  );
}
