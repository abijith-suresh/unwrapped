import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
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
  decodeBase64Input,
  encodeBytesToBase64,
  formatBase64FileNotice,
  processBase64Input,
} from "@/lib/base64";
import { EXAMPLE_TEXT } from "@/lib/exampleData";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  type FileImportError,
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
  const [input, setInput] = createSignal("");
  const [fileError, setFileError] = createSignal<FileImportError | null>(null);
  const [loadedFile, setLoadedFile] = createSignal<ImportedFileMeta | null>(null);
  const [loadedFileBytes, setLoadedFileBytes] = createSignal<Uint8Array | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);

  let latestFileLoad = 0;
  const isExample = () => input() === "" && !loadedFile() && !fileError();
  const exampleInput = createMemo(() =>
    mode() === "encode"
      ? EXAMPLE_TEXT
      : encodeBytesToBase64(new TextEncoder().encode(EXAMPLE_TEXT), variant())
  );
  const textInput = createMemo(() => (isExample() ? exampleInput() : input()));
  const result = createMemo(() => {
    if (mode() === "encode" && loadedFileBytes()) {
      return {
        ok: true as const,
        value: encodeBytesToBase64(loadedFileBytes() ?? new Uint8Array(), variant()),
        outputKind: "text" as const,
      };
    }

    return mode() === "decode"
      ? decodeBase64Input(textInput(), variant(), loadedFile()?.name)
      : processBase64Input(textInput(), "encode", variant(), "text");
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
  const decodedOutput = createMemo(() => {
    const current = result();
    return mode() === "decode" && current.ok && "bytes" in current ? current : null;
  });
  const canSwap = () => !isExample() && !!outputValue() && !binaryOutput();

  function clearFile() {
    latestFileLoad++;
    setFileError(null);
    setFileNotice(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
  }

  function swap() {
    if (!canSwap()) return;
    const current = outputValue();
    clearFile();
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setInput(current);
  }

  function reset() {
    setMode("encode");
    setVariant("standard");
    setInput("");
    clearFile();
  }

  function handleModeChange(nextMode: Base64Mode) {
    if (mode() === nextMode) return;
    const encodedFile = mode() === "encode" && loadedFileBytes() ? outputValue() : null;
    clearFile();
    setMode(nextMode);
    if (encodedFile !== null) setInput(encodedFile);
  }

  async function handleFile(file: File) {
    const request = ++latestFileLoad;
    setFileError(null);
    setFileNotice(null);

    if (mode() === "encode") {
      const result = await readImportedFile(file, {
        as: "bytes",
        policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
      });

      if (request !== latestFileLoad) return;
      if (!result.ok) {
        setFileError(result.error);
        return;
      }

      if (result.decision.status === "warn") {
        setFileNotice(formatBase64FileNotice(result.file, "encode", "file"));
      }

      setLoadedFile(result.file);
      setLoadedFileBytes(result.value);
      setInput("");
      return;
    }

    const result = await readImportedFile(file, {
      as: "text",
      policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
    });
    if (request !== latestFileLoad) return;

    if (!result.ok) {
      setFileError(result.error);
      return;
    }

    if (result.decision.status === "warn") {
      setFileNotice(formatBase64FileNotice(result.file, "decode", "text"));
    }

    setLoadedFile(result.file);
    setLoadedFileBytes(null);
    setInput(result.value);
  }

  function downloadDecodedBytes() {
    const current = decodedOutput();
    if (!current || current.bytes.length === 0) {
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
            <ToolActionButton onClick={swap} title="Swap input/output" disabled={!canSwap()}>
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
      </ToolToolbar>
      <ToolDropZone onFile={(file) => void handleFile(file)}>
        <ToolInputPanel
          compact
          label={
            mode() === "encode"
              ? loadedFileBytes()
                ? "Input file"
                : "Plain text"
              : variant() === "url"
                ? "Base64url"
                : "Base64"
          }
          name="base64-input"
          autocomplete="off"
          spellcheck={false}
          value={input()}
          onInput={(value) => {
            clearFile();
            setInput(value);
          }}
          placeholder={exampleInput()}
          file={mode() === "encode" && loadedFileBytes() ? loadedFile() : null}
          onRemoveFile={clearFile}
          rows={8}
          error={!!transformError()}
          describedBy={transformError() ? "base64-error" : undefined}
          actions={
            <ToolFilePicker
              label={loadedFile() ? "Replace file" : "Open file"}
              onFileChange={(file) => void handleFile(file)}
            />
          }
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
              : binaryOutput()
                ? "Decoded bytes"
                : "Decoded text"
          }
          value={outputValue()}
          isExample={isExample()}
          copyLabel="Copy"
          actions={
            decodedOutput() ? (
              <>
                <Show when={!binaryOutput()}>
                  <CopyButton text={outputValue()} />
                </Show>
                <ToolActionButton onClick={downloadDecodedBytes}>Download file</ToolActionButton>
              </>
            ) : undefined
          }
        />
      </Show>
    </ToolContainer>
  );
}
