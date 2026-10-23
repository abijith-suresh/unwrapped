import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import Select from "@/components/primitives/solid/Select";
import ToolActionButton from "@/components/ToolActionButton";
import ToolDownloadButton from "@/components/ToolDownloadButton";
import ToolHandoffButton from "@/components/ToolHandoffButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolComparerWorkspace from "@/components/tool/ToolComparerWorkspace";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolDropZone from "@/components/tool/ToolDropZone";
import ToolExampleNotice from "@/components/tool/ToolExampleNotice";
import ToolFilePicker from "@/components/tool/ToolFilePicker";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolPanel from "@/components/tool/ToolPanel";
import { useToolHandoff } from "@/components/toolHandoff";
import type { DiffAnalysisResult } from "@/lib/diffAnalysis";
import { createDiffAnalysisExecutor } from "@/lib/diffExecution";
import { EXAMPLE_DIFF_MODIFIED, EXAMPLE_DIFF_ORIGINAL } from "@/lib/exampleData";
import {
  formatBytes,
  formatFileReadFailureMessage,
  formatFileTooLargeMessage,
  formatLargeFileNotice,
  type ImportedFileMeta,
  readImportedFile,
} from "@/lib/fileImport";
import { type Language, SUPPORTED_LANGUAGES } from "@/lib/language";
import { detectLanguage } from "@/lib/languageDetection";
import { DIFF_SESSION_STORAGE_KEY } from "@/lib/localPersistence";
import { clearSessionState, loadSessionState, saveSessionState } from "@/lib/session";
import { WorkerExecutionError } from "@/lib/workerExecution";
import {
  DEFAULT_DIFF_SESSION_STATE,
  DIFF_SESSION_VERSION,
  isDiffSessionState,
  shouldPersistDiffSession,
} from "@/tools/diff/diffSession";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 400;
const DIFF_CONTEXT = 3;
const EMPTY_STATS = { added: 0, removed: 0 };

const LANGUAGE_LABELS: Record<Language, string> = {
  text: "Text",
  json: "JSON",
  toml: "TOML",
  yaml: "YAML",
  env: ".env",
  ini: "INI",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  markdown: "Markdown",
  xml: "XML",
  html: "HTML",
  shell: "Shell",
  dockerfile: "Dockerfile",
};

const STRATEGY_LABELS: Record<string, string> = {
  json: "Normalized JSON",
  toml: "Normalized TOML",
  yaml: "Normalized YAML",
  env: "Normalized .env",
  text: "Text",
};

type DiffSide = "left" | "right";

const DIFF_SIDES: readonly DiffSide[] = ["left", "right"];
const SIDE_LABELS: Record<DiffSide, string> = {
  left: "Original",
  right: "Modified",
};

type FileFeedback = Record<DiffSide, string | null>;

const EMPTY_FILE_FEEDBACK: FileFeedback = {
  left: null,
  right: null,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InputPanelProps {
  label: string;
  content: string;
  lang: Language;
  fileMeta: ImportedFileMeta | null;
  onContentChange: (v: string) => void;
  onLangChange: (v: Language) => void;
  onFileLoad: (file: File) => void;
}

function InputPanel(props: InputPanelProps) {
  return (
    <ToolDropZone onFile={props.onFileLoad}>
      <ToolInputPanel
        label={`${props.label} text`}
        name={`diff-${props.label.toLowerCase()}-text`}
        value={props.content}
        onInput={props.onContentChange}
        placeholder={props.label === "Original" ? EXAMPLE_DIFF_ORIGINAL : EXAMPLE_DIFF_MODIFIED}
        actions={
          <>
            <Select
              aria-label={`${props.label} language`}
              name={`diff-${props.label.toLowerCase()}-language`}
              value={props.lang}
              onChange={(value) => props.onLangChange(value as Language)}
              options={SUPPORTED_LANGUAGES.map((value) => ({
                value,
                label: LANGUAGE_LABELS[value],
              }))}
              class="w-auto"
              controlClass="!w-auto"
            />
            <ToolFilePicker onFileChange={props.onFileLoad} />
          </>
        }
      />
      <Show when={props.fileMeta}>
        {(file) => (
          <p class="m-0 mt-2 break-all text-xs text-[var(--text-muted)]">
            {file().name} · {formatBytes(file().size)}
          </p>
        )}
      </Show>
    </ToolDropZone>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DiffTool() {
  const diffExecutor = createDiffAnalysisExecutor();

  // --- State signals --------------------------------------------------------
  const [leftContent, setLeftContent] = createSignal("");
  const [rightContent, setRightContent] = createSignal("");
  const [leftLang, setLeftLang] = createSignal<Language>("text");
  const [rightLang, setRightLang] = createSignal<Language>("text");
  const [changesOnly, setChangesOnly] = createSignal(true);
  const [pending, setPending] = createSignal(false);
  const [cancelled, setCancelled] = createSignal(false);
  const [currentChangeIdx, setCurrentChangeIdx] = createSignal(-1);
  const [changeAnnouncement, setChangeAnnouncement] = createSignal("");
  const [analysisError, setAnalysisError] = createSignal<string | null>(null);
  const [fileError, setFileError] = createSignal<FileFeedback>({ ...EMPTY_FILE_FEEDBACK });
  const [fileNotice, setFileNotice] = createSignal<FileFeedback>({ ...EMPTY_FILE_FEEDBACK });
  const [leftFile, setLeftFile] = createSignal<ImportedFileMeta | null>(null);
  const [rightFile, setRightFile] = createSignal<ImportedFileMeta | null>(null);
  const [analysis, setAnalysis] = createSignal<DiffAnalysisResult | null>(null);

  // diffData holds the committed snapshot used for computing the diff
  const [diffData, setDiffData] = createSignal<{
    original: string;
    modified: string;
    leftLang: Language;
    rightLang: Language;
  } | null>(null);
  let latestAnalysisRun = 0;
  const fileLoadRuns: Record<DiffSide, number> = { left: 0, right: 0 };
  const isExample = () =>
    leftContent() === "" &&
    rightContent() === "" &&
    !leftFile() &&
    !rightFile() &&
    !fileError().left &&
    !fileError().right;

  // --- Debounced diff trigger -----------------------------------------------
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    const savedSession = loadSessionState({
      key: DIFF_SESSION_STORAGE_KEY,
      version: DIFF_SESSION_VERSION,
      isData: isDiffSessionState,
      migrate: (value, fromVersion) => {
        if (fromVersion !== 1 || typeof value !== "object" || value === null) {
          return null;
        }

        const legacy = value as Record<string, unknown>;
        if (
          typeof legacy.leftLang !== "string" ||
          typeof legacy.rightLang !== "string" ||
          typeof legacy.changesOnly !== "boolean"
        ) {
          return null;
        }

        return {
          leftLang: legacy.leftLang as Language,
          rightLang: legacy.rightLang as Language,
          changesOnly: legacy.changesOnly,
        };
      },
    });

    if (!savedSession) {
      return;
    }

    batch(() => {
      setLeftLang(savedSession.leftLang);
      setRightLang(savedSession.rightLang);
      setChangesOnly(savedSession.changesOnly);
    });
  });

  useToolHandoff("diff", (handoff) => {
    setLeftContent(handoff.value);
    setLeftLang(
      SUPPORTED_LANGUAGES.includes(handoff.format as Language)
        ? (handoff.format as Language)
        : "text"
    );
  });

  createEffect(() => {
    // Access reactive dependencies
    const example = isExample();
    const left = example ? EXAMPLE_DIFF_ORIGINAL : leftContent();
    const right = example ? EXAMPLE_DIFF_MODIFIED : rightContent();
    const ll = example ? "text" : leftLang();
    const rl = example ? "text" : rightLang();

    latestAnalysisRun++;
    diffExecutor.cancel();
    setCancelled(false);

    if (debounceTimer !== null) clearTimeout(debounceTimer);

    if (left === "" && right === "") {
      setPending(false);
      setAnalysis(null);
      setDiffData(null);
      setAnalysisError(null);
      setChangeAnnouncement("");
      return;
    }

    setPending(true);
    setAnalysisError(null);
    setChangeAnnouncement("");
    if (example) {
      setDiffData({ original: left, modified: right, leftLang: ll, rightLang: rl });
      return;
    }
    debounceTimer = setTimeout(() => {
      batch(() => {
        setDiffData({ original: left, modified: right, leftLang: ll, rightLang: rl });
        setCurrentChangeIdx(-1);
        setChangeAnnouncement("");
      });
    }, DEBOUNCE_MS);
  });

  createEffect(() => {
    const data = diffData();
    const changesOnlyEnabled = changesOnly();
    const runId = ++latestAnalysisRun;

    if (!data) {
      setAnalysis(null);
      setPending(false);
      setAnalysisError(null);
      return;
    }

    setPending(true);
    setCancelled(false);
    setAnalysisError(null);
    setCurrentChangeIdx(-1);
    setChangeAnnouncement("");

    void diffExecutor
      .execute({
        original: data.original,
        modified: data.modified,
        leftLanguage: data.leftLang,
        rightLanguage: data.rightLang,
        changesOnly: changesOnlyEnabled,
        context: DIFF_CONTEXT,
      })
      .then((response) => {
        if (runId !== latestAnalysisRun) {
          return;
        }

        batch(() => {
          setAnalysis(response.result);
          setPending(false);
          setAnalysisError(null);
        });
      })
      .catch((error: unknown) => {
        if (runId !== latestAnalysisRun) {
          return;
        }

        batch(() => {
          setAnalysis(null);
          setPending(false);
          setAnalysisError(
            error instanceof WorkerExecutionError
              ? error.message
              : "The comparison could not be completed. Edit an input to try again."
          );
        });
      });
  });

  createEffect(() => {
    const sessionState = {
      leftLang: leftLang(),
      rightLang: rightLang(),
      changesOnly: changesOnly(),
    };

    if (
      sessionState.leftLang === DEFAULT_DIFF_SESSION_STATE.leftLang &&
      sessionState.rightLang === DEFAULT_DIFF_SESSION_STATE.rightLang &&
      sessionState.changesOnly === DEFAULT_DIFF_SESSION_STATE.changesOnly
    ) {
      clearSessionState(DIFF_SESSION_STORAGE_KEY);
      return;
    }

    if (!shouldPersistDiffSession(sessionState)) {
      clearSessionState(DIFF_SESSION_STORAGE_KEY);
      return;
    }

    saveSessionState({
      key: DIFF_SESSION_STORAGE_KEY,
      version: DIFF_SESSION_VERSION,
      data: sessionState,
    });
  });

  function cancelComparison() {
    latestAnalysisRun++;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    diffExecutor.cancel();
    setPending(false);
    setCancelled(true);
    setChangeAnnouncement("Comparison cancelled. Edit an input to compare again.");
  }

  onCleanup(() => {
    latestAnalysisRun++;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    diffExecutor.dispose();
  });

  // --- Memos ----------------------------------------------------------------
  const filteredRows = createMemo(() => analysis()?.filteredRows ?? []);

  const stats = createMemo(() => analysis()?.stats ?? EMPTY_STATS);

  const changeIndices = createMemo(() => analysis()?.changeIndices ?? []);

  const strategy = createMemo(() => analysis()?.strategy ?? "text");

  const structuredErrors = createMemo(() => analysis()?.errors ?? []);

  const isEmpty = createMemo(() => leftContent() === "" && rightContent() === "");

  const isIdentical = createMemo(() => analysis()?.isIdentical ?? false);

  // --- File handling --------------------------------------------------------
  function updateFileFeedback(setter: typeof setFileError, side: DiffSide, message: string | null) {
    setter((feedback) => ({ ...feedback, [side]: message }));
  }

  async function handleFileLoad(side: DiffSide, file: File) {
    const runId = ++fileLoadRuns[side];
    const isCurrentRun = () => fileLoadRuns[side] === runId;
    updateFileFeedback(setFileError, side, null);
    updateFileFeedback(setFileNotice, side, null);

    const result = await readImportedFile(file, { as: "text" });

    if (!isCurrentRun()) return;

    if (!result.ok) {
      if (result.error.code === "file-too-large") {
        updateFileFeedback(
          setFileError,
          side,
          formatFileTooLargeMessage(file, result.error.maxBytes)
        );
      } else {
        updateFileFeedback(setFileError, side, formatFileReadFailureMessage(result.error));
      }
      return;
    }

    if (result.decision.status === "warn") {
      updateFileFeedback(setFileNotice, side, formatLargeFileNotice(result.file, "compare"));
    }

    const lang = detectLanguage({ filename: file.name, content: result.value });
    if (side === "left") {
      batch(() => {
        setLeftContent(result.value);
        setLeftLang(lang);
        setLeftFile(result.file);
      });
    } else {
      batch(() => {
        setRightContent(result.value);
        setRightLang(lang);
        setRightFile(result.file);
      });
    }
  }

  // --- Next change navigation -----------------------------------------------
  function scrollToChange(idx: number) {
    const indices = changeIndices();
    if (indices.length === 0) return;
    const clamped = ((idx % indices.length) + indices.length) % indices.length;
    setCurrentChangeIdx(clamped);
    setChangeAnnouncement(`Change ${clamped + 1} of ${indices.length}.`);
    const sourceRow = indices[clamped];
    const el = document.querySelector(`[data-source-row="${sourceRow}"]`);
    if (el) {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
  }

  function handleNextChange() {
    scrollToChange(currentChangeIdx() + 1);
  }

  // --- Swap -----------------------------------------------------------------
  function handleSwap() {
    batch(() => {
      const lc = leftContent();
      const rc = rightContent();
      const ll = leftLang();
      const rl = rightLang();
      const lf = leftFile();
      const rf = rightFile();
      setLeftContent(rc);
      setRightContent(lc);
      setLeftLang(rl);
      setRightLang(ll);
      setLeftFile(rf);
      setRightFile(lf);
    });
  }

  // Separator rows between context groups
  function isSeparator(sourceIndex: number, prevSourceIndex: number | undefined): boolean {
    if (!changesOnly()) return false;
    if (prevSourceIndex === undefined) return false;
    return sourceIndex > prevSourceIndex + 1;
  }

  // ---------------------------------------------------------------------------
  const comparisonReport = createMemo(() =>
    JSON.stringify(
      { strategy: analysis()?.strategy, stats: analysis()?.stats, rows: analysis()?.rows },
      null,
      2
    )
  );

  return (
    <ToolContainer class="gap-4">
      <ToolComparerWorkspace
        left={
          <InputPanel
            label="Original"
            content={leftContent()}
            lang={leftLang()}
            fileMeta={leftFile()}
            onContentChange={setLeftContent}
            onLangChange={setLeftLang}
            onFileLoad={(file) => void handleFileLoad("left", file)}
          />
        }
        right={
          <InputPanel
            label="Modified"
            content={rightContent()}
            lang={rightLang()}
            fileMeta={rightFile()}
            onContentChange={setRightContent}
            onLangChange={setRightLang}
            onFileLoad={(file) => void handleFileLoad("right", file)}
          />
        }
      >
        <ToolExampleNotice when={isExample()} />

        <For each={DIFF_SIDES}>
          {(side) => (
            <Show when={fileError()[side]}>
              <ToolStatusMessage tone="error">
                <strong>{SIDE_LABELS[side]}:</strong> {fileError()[side]}
              </ToolStatusMessage>
            </Show>
          )}
        </For>

        <For each={DIFF_SIDES}>
          {(side) => (
            <Show when={fileNotice()[side]}>
              <ToolStatusMessage tone="warning">
                <strong>{SIDE_LABELS[side]}:</strong> {fileNotice()[side]}
              </ToolStatusMessage>
            </Show>
          )}
        </For>
        <Show when={!isEmpty() || isExample()}>
          <ToolPanel
            title="Differences"
            titleAddon={
              <>
                <Show when={pending()}>
                  <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--fs-2xs)] font-medium leading-none text-[var(--text-muted)]">
                    <span
                      aria-hidden="true"
                      class="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-primary)]"
                    />
                    Comparing…
                  </span>
                </Show>
                <Show when={analysis() !== null && !isExample()}>
                  <span class="inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--fs-2xs)] font-semibold uppercase tracking-[0.12em] leading-none text-[var(--text-muted)]">
                    {STRATEGY_LABELS[strategy()] ?? "Text"}
                  </span>
                </Show>
                <Show when={analysis() !== null && !pending()}>
                  <Show
                    when={isIdentical()}
                    fallback={
                      <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--fs-2xs)] font-semibold tabular-nums leading-none">
                        <span class="text-[var(--accent-success)]">+{stats().added}</span>
                        <span class="text-[var(--accent-error)]">−{stats().removed}</span>
                      </span>
                    }
                  >
                    <span class="inline-flex items-center rounded-full border border-[var(--accent-success)] px-2 py-0.5 text-[var(--fs-2xs)] font-semibold leading-none text-[var(--accent-success)]">
                      Identical
                    </span>
                  </Show>
                </Show>
              </>
            }
            actions={
              <>
                <ToolActionButton
                  variant="toggle"
                  active={changesOnly()}
                  onClick={() => setChangesOnly((value) => !value)}
                  title="Show only changed lines"
                >
                  Changes only
                </ToolActionButton>
                <Show when={changeIndices().length > 0}>
                  <ToolActionButton
                    onClick={handleNextChange}
                    disabled={pending()}
                    title="Jump to next change"
                  >
                    Next change
                  </ToolActionButton>
                </Show>
                <Show when={!isExample() && analysis() !== null && !pending() && !cancelled()}>
                  <ToolDownloadButton
                    compact
                    value={comparisonReport()}
                    format="json"
                    fileName="comparison.json"
                    label="Download comparison"
                  />
                  <ToolHandoffButton compact value={comparisonReport()} format="json" />
                </Show>
                <ToolActionButton variant="ghost" onClick={handleSwap} title="Swap left and right">
                  Swap
                </ToolActionButton>
              </>
            }
          >
            <div class="flex flex-col gap-3">
              <Show when={pending()}>
                <div
                  aria-hidden="true"
                  class="h-0.5 overflow-hidden rounded-full bg-[var(--border)]"
                >
                  <div class="h-full w-1/3 animate-pulse bg-[var(--accent-primary)]" />
                </div>
              </Show>

              <Show
                when={pending() || cancelled() || analysisError() || structuredErrors().length > 0}
              >
                <div class="flex flex-col gap-2" role="status" aria-live="polite">
                  <Show when={pending()}>
                    <ToolStatusMessage>
                      <span class="flex items-center justify-between gap-3">
                        Comparing…
                        <ToolActionButton
                          variant="ghost"
                          onClick={cancelComparison}
                          class="!min-h-0 !px-2.5 !py-1"
                        >
                          Cancel
                        </ToolActionButton>
                      </span>
                    </ToolStatusMessage>
                  </Show>
                  <Show when={cancelled()}>
                    <ToolStatusMessage>
                      Comparison cancelled. Edit an input to compare again.
                    </ToolStatusMessage>
                  </Show>
                  <Show when={analysisError()}>
                    <ToolStatusMessage tone="error">{analysisError()}</ToolStatusMessage>
                  </Show>
                  <For each={structuredErrors()}>
                    {(err) => (
                      <ToolStatusMessage tone="warning">
                        <strong class="capitalize">{err.side}</strong>: {err.message} — falling back
                        to text diff.
                      </ToolStatusMessage>
                    )}
                  </For>
                </div>
              </Show>

              <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {changeAnnouncement()}
              </span>

              <Show when={analysis() !== null && diffData() !== null}>
                <div
                  class="flex min-w-0 flex-col gap-2 transition-opacity duration-[var(--motion-base)] ease-[var(--motion-ease-standard)]"
                  classList={{ "opacity-40": pending() || cancelled() }}
                  aria-busy={pending() || undefined}
                >
                  <Show when={filteredRows().length > 0}>
                    <div class="overflow-x-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg-secondary)]">
                      <table class="w-max min-w-full border-collapse text-sm leading-[1.5]">
                        <colgroup>
                          <col style="width: 2.75rem" />
                          <col style="width: 2.75rem" />
                        </colgroup>
                        <tbody>
                          <For each={filteredRows()}>
                            {(indexedRow, i) => {
                              const { row, sourceIndex } = indexedRow;
                              const prevSourceIndex =
                                i() > 0 ? filteredRows()[i() - 1]?.sourceIndex : undefined;
                              const showSeparator = isSeparator(sourceIndex, prevSourceIndex);

                              return (
                                <>
                                  <Show when={showSeparator}>
                                    <tr>
                                      <td
                                        colspan={4}
                                        class="px-3 py-0.5 bg-[var(--bg-primary)] text-[var(--text-muted)] text-xs font-mono tracking-wider border-t border-b border-[var(--border)]"
                                      >
                                        · · ·
                                      </td>
                                    </tr>
                                  </Show>
                                  <tr
                                    data-source-row={sourceIndex}
                                    classList={{
                                      "border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)]":
                                        !showSeparator && i() !== 0,
                                    }}
                                  >
                                    {/* Left line number */}
                                    <td
                                      class="select-none text-right px-2 min-w-[2.5rem] text-[var(--text-muted)] tabular-nums border-r border-[var(--border)] text-xs"
                                      classList={{
                                        "bg-[color-mix(in_srgb,var(--accent-error)_18%,transparent)]":
                                          row.type === "removed",
                                        "bg-[color-mix(in_srgb,var(--accent-error)_12%,transparent)]":
                                          row.type === "changed",
                                      }}
                                    >
                                      <Show when={row.leftLineNum !== null}>{row.leftLineNum}</Show>
                                    </td>
                                    {/* Left content */}
                                    <td
                                      class="px-3 whitespace-pre font-mono text-xs"
                                      classList={{
                                        "bg-[color-mix(in_srgb,var(--accent-error)_18%,transparent)]":
                                          row.type === "removed",
                                        "bg-[color-mix(in_srgb,var(--accent-error)_12%,transparent)]":
                                          row.type === "changed",
                                      }}
                                    >
                                      <Show when={row.left !== null}>{row.left}</Show>
                                    </td>
                                    {/* Right line number */}
                                    <td
                                      class="select-none text-right px-2 min-w-[2.5rem] text-[var(--text-muted)] tabular-nums border-r border-[var(--border)] border-l border-[var(--border)] text-xs"
                                      classList={{
                                        "bg-[color-mix(in_srgb,var(--accent-success)_18%,transparent)]":
                                          row.type === "added",
                                        "bg-[color-mix(in_srgb,var(--accent-success)_12%,transparent)]":
                                          row.type === "changed",
                                      }}
                                    >
                                      <Show when={row.rightLineNum !== null}>
                                        {row.rightLineNum}
                                      </Show>
                                    </td>
                                    {/* Right content */}
                                    <td
                                      class="px-3 whitespace-pre font-mono text-xs"
                                      classList={{
                                        "bg-[color-mix(in_srgb,var(--accent-success)_18%,transparent)]":
                                          row.type === "added",
                                        "bg-[color-mix(in_srgb,var(--accent-success)_12%,transparent)]":
                                          row.type === "changed",
                                      }}
                                    >
                                      <Show when={row.right !== null}>{row.right}</Show>
                                    </td>
                                  </tr>
                                </>
                              );
                            }}
                          </For>
                        </tbody>
                      </table>
                    </div>
                  </Show>

                  {/* No changes in "changes only" mode but diffs exist */}
                  <Show when={filteredRows().length === 0 && changesOnly() && !isIdentical()}>
                    <div class="text-center text-[var(--text-muted)] text-sm py-6">
                      No changes to display with current context settings.
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          </ToolPanel>
        </Show>
      </ToolComparerWorkspace>
    </ToolContainer>
  );
}
