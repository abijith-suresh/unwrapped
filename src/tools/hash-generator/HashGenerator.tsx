import { createMemo, createResource, createSignal, onCleanup, Show } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolDropZone from "@/components/tool/ToolDropZone";
import ToolFilePicker from "@/components/tool/ToolFilePicker";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import { EXAMPLE_TEXT } from "@/lib/exampleData";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  type FileImportError,
  formatBytes,
  formatFileReadFailureMessage,
  formatLargeFileNotice,
  type ImportedFileMeta,
  readImportedFile,
} from "@/lib/fileImport";
import { type HashResult, hashBytesWithAlgorithms, hashTextWithAlgorithms } from "@/lib/hash";

export default function HashGenerator() {
  const workflow = () => (loadedFileBytes() ? "file" : "text");
  const [input, setInput] = createSignal("");
  const [results, setResults] = createSignal<HashResult[]>([]);
  const [computing, setComputing] = createSignal(false);
  const [fileError, setFileError] = createSignal<FileImportError | null>(null);
  const [loadedFile, setLoadedFile] = createSignal<ImportedFileMeta | null>(null);
  const [loadedFileBytes, setLoadedFileBytes] = createSignal<Uint8Array | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let latestCompute = 0;
  let latestFileLoad = 0;
  const isExample = () => workflow() === "text" && input() === "" && !loadedFile() && !fileError();
  const [example] = createResource(isExample, () =>
    hashTextWithAlgorithms(EXAMPLE_TEXT).catch(() => [])
  );
  const displayedResults = createMemo(() => (isExample() ? (example() ?? []) : results()));

  function invalidateResults() {
    latestCompute++;
    latestFileLoad++;
    setResults([]);
    setComputing(false);
  }

  const readFileError = createMemo(() => {
    const error = fileError();
    return error?.code === "read-failed" ? error : null;
  });

  async function computeText(text: string) {
    const run = ++latestCompute;
    if (!text.trim()) {
      setResults([]);
      setComputing(false);
      return;
    }

    setComputing(true);

    try {
      const next = await hashTextWithAlgorithms(text);
      if (run === latestCompute) setResults(next);
    } finally {
      if (run === latestCompute) setComputing(false);
    }
  }

  async function computeBytes(bytes: Uint8Array) {
    const run = ++latestCompute;

    setComputing(true);

    try {
      const next = await hashBytesWithAlgorithms(bytes);
      if (run === latestCompute) setResults(next);
    } finally {
      if (run === latestCompute) setComputing(false);
    }
  }

  function handleInput(value: string) {
    invalidateResults();
    setInput(value);
    setFileError(null);
    setFileNotice(null);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void computeText(value), 300);
  }

  function handleClear() {
    invalidateResults();
    clearTimeout(debounceTimer);
    setInput("");
    setResults([]);
    setComputing(false);
    setFileError(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileNotice(null);
  }

  async function handleFile(file: File) {
    invalidateResults();
    const run = latestFileLoad;
    clearTimeout(debounceTimer);
    setFileError(null);
    setFileNotice(null);

    const result = await readImportedFile(file, {
      as: "bytes",
      policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
    });
    if (run !== latestFileLoad) return;

    if (!result.ok) {
      setFileError(result.error);
      setResults([]);
      return;
    }

    if (result.decision.status === "warn") {
      setFileNotice(formatLargeFileNotice(result.file, "hash"));
    }

    setLoadedFile(result.file);
    setLoadedFileBytes(result.value);
    setInput("");
    await computeBytes(result.value);
  }

  onCleanup(() => {
    invalidateResults();
    clearTimeout(debounceTimer);
  });

  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        isExample={isExample()}
        layout="rows"
        fields={displayedResults().map((result) => ({
          label: result.algorithm,
          value: result.hex,
          copyLabel: `Copy ${result.algorithm} hash`,
        }))}
        input={
          <ToolDropZone onFile={(file) => void handleFile(file)}>
            <ToolInputPanel
              compact
              label={workflow() === "text" ? "Input text" : "Input file"}
              name="hash-input"
              autocomplete="off"
              spellcheck={false}
              value={input()}
              onInput={handleInput}
              placeholder={EXAMPLE_TEXT}
              rows={5}
              file={loadedFile()}
              onRemoveFile={handleClear}
              actions={
                <>
                  <Show when={!loadedFile()}>
                    <ToolActionButton onClick={handleClear} disabled={!input()}>
                      Clear
                    </ToolActionButton>
                  </Show>
                  <ToolFilePicker
                    label={loadedFile() ? "Replace file" : "Open file"}
                    onFileChange={(file) => void handleFile(file)}
                  />
                </>
              }
            />
          </ToolDropZone>
        }
        status={
          <>
            <Show when={fileNotice()}>
              <ToolStatusMessage tone="warning">{fileNotice()}</ToolStatusMessage>
            </Show>
            <Show when={fileError()?.code === "file-too-large"}>
              <ToolStatusMessage tone="error">
                File is too large. Maximum supported size is {formatBytes(DEFAULT_IMPORT_MAX_BYTES)}
                .
              </ToolStatusMessage>
            </Show>
            <Show when={readFileError()}>
              {(error) => (
                <ToolStatusMessage tone="error">
                  {formatFileReadFailureMessage(error())}
                </ToolStatusMessage>
              )}
            </Show>

            <Show when={computing()}>
              <ToolStatusMessage tone="muted">Computing…</ToolStatusMessage>
            </Show>
          </>
        }
      />
    </ToolContainer>
  );
}
