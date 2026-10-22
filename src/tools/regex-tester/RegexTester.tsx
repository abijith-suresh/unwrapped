import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolOutputPanel from "@/components/tool/ToolOutputPanel";
import ToolPanel from "@/components/tool/ToolPanel";
import ToolSegmentedControl from "@/components/tool/ToolSegmentedControl";
import { useToolHandoff } from "@/components/toolHandoff";
import { EXAMPLE_REGEX_PATTERN, EXAMPLE_REGEX_REPLACEMENT, EXAMPLE_TEXT } from "@/lib/exampleData";
import {
  analyzeRegex,
  type FlagKey,
  type MatchResult,
  type RegexAnalysisResult,
} from "@/lib/regex";
import { createRegexAnalysisExecutor } from "@/lib/regexExecution";
import { WorkerExecutionError } from "@/lib/workerExecution";

interface Flag {
  key: FlagKey;
  label: string;
  title: string;
}

const ALL_FLAGS: Flag[] = [
  { key: "g", label: "g", title: "Global — find all matches" },
  { key: "i", label: "i", title: "Case-insensitive" },
  { key: "m", label: "m", title: "Multiline — ^ and $ match line boundaries" },
  { key: "s", label: "s", title: "Dot-all — . matches newlines" },
];

type RegexMode = "match" | "replace";

function CaptureCell(props: { value: string | null | undefined }) {
  return (
    <td class="px-[var(--space-3)] py-[var(--space-2)] align-top text-[var(--text-primary)] border-b border-[var(--border)] break-words min-w-0">
      <Show
        when={props.value !== null && props.value !== undefined}
        fallback={<span class="text-[var(--text-muted)]">Unmatched</span>}
      >
        <Show
          when={props.value !== ""}
          fallback={<span class="text-[var(--text-muted)]">Empty string</span>}
        >
          {props.value}
        </Show>
      </Show>
    </td>
  );
}

export default function RegexTester() {
  const [mode, setMode] = createSignal<RegexMode>("match");
  const [pattern, setPattern] = createSignal("");
  const [flags, setFlags] = createSignal<Set<FlagKey>>(new Set(["g"]));
  const [input, setInput] = createSignal("");
  useToolHandoff("regex-tester", (handoff) => setInput(handoff.value));
  const [replacement, setReplacement] = createSignal("");
  const executor = createRegexAnalysisExecutor();
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let run = 0;
  const [pending, setPending] = createSignal(false);
  const [cancelled, setCancelled] = createSignal(false);
  const emptyAnalysis: RegexAnalysisResult = {
    match: {
      matches: [],
      highlighted: [],
      error: null,
      summary: { captureGroupCount: 0, emptyMatchCount: 0, firstMatchIndex: null },
    },
    replacement: { output: "", replacements: 0 },
  };
  const [analysis, setAnalysis] = createSignal(emptyAnalysis);
  const isExample = () => pattern() === "" && input() === "" && replacement() === "";
  const effectivePattern = () => (isExample() ? EXAMPLE_REGEX_PATTERN : pattern());
  const example = createMemo(() =>
    analyzeRegex({
      pattern: EXAMPLE_REGEX_PATTERN,
      input: EXAMPLE_TEXT,
      flags: [...flags()],
      replacement: EXAMPLE_REGEX_REPLACEMENT,
      mode: mode(),
    })
  );

  function cancelMatching() {
    run++;
    clearTimeout(debounceTimer);
    executor.cancel();
    setPending(false);
    setCancelled(true);
  }

  createEffect(() => {
    const request = {
      pattern: pattern(),
      flags: [...flags()],
      input: input(),
      replacement: replacement(),
      mode: mode(),
    };
    cancelMatching();
    setCancelled(false);
    if (isExample()) return;
    const currentRun = run;
    setPending(true);
    debounceTimer = setTimeout(() => {
      void executor
        .execute(request)
        .then((response) => {
          if (run !== currentRun) return;
          setAnalysis(response.result);
          setPending(false);
        })
        .catch((error: unknown) => {
          if (run !== currentRun) return;
          setAnalysis({
            ...emptyAnalysis,
            match: {
              ...emptyAnalysis.match,
              error:
                error instanceof WorkerExecutionError
                  ? error.message
                  : "Matching could not be completed.",
            },
          });
          setPending(false);
        });
    }, 150);
  });
  onCleanup(() => {
    run++;
    clearTimeout(debounceTimer);
    executor.dispose();
  });

  function toggleFlag(key: FlagKey) {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const result = () => (isExample() ? example() : analysis()).match;
  const matchCount = createMemo(() => result().matches.length);
  const replaceResult = () => (isExample() ? example() : analysis()).replacement;
  const replaceOutput = createMemo(() => {
    const current = replaceResult();
    return "error" in current ? "" : current.output;
  });

  const numberedGroups = createMemo(
    () => result().matches[0]?.groups.map((group) => group.number) ?? []
  );
  const namedGroupNames = createMemo(
    () => result().matches[0]?.namedGroups.map((group) => group.name) ?? []
  );
  const hasCaptures = () => numberedGroups().length > 0;

  const matchesReport = createMemo(() =>
    JSON.stringify({ matches: result().matches, summary: result().summary }, null, 2)
  );

  const statusLine = createMemo(() => {
    const current = result();
    const parts = [
      matchCount() === 0
        ? "No matches"
        : `${matchCount()} ${matchCount() === 1 ? "match" : "matches"}`,
      `${current.summary.captureGroupCount} capture ${
        current.summary.captureGroupCount === 1 ? "group" : "groups"
      }`,
    ];
    if (current.summary.firstMatchIndex !== null) {
      parts.push(`First match at index ${current.summary.firstMatchIndex}`);
    }
    if (current.summary.emptyMatchCount > 0) {
      parts.push(
        `${current.summary.emptyMatchCount} empty ${
          current.summary.emptyMatchCount === 1 ? "match" : "matches"
        }`
      );
    }
    return parts.join(" · ");
  });

  return (
    <ToolContainer>
      <ToolInspectorWorkspace
        input={
          <>
            <div class="flex flex-col gap-2">
              <ToolSegmentedControl
                label="Operation"
                hideLabel
                value={mode()}
                onChange={setMode}
                options={[
                  { value: "match", label: "Match" },
                  { value: "replace", label: "Replace" },
                ]}
              />

              <Label for="regex-pattern">Pattern</Label>
              <div
                class="flex items-center bg-[var(--bg-secondary)] rounded-[var(--radius-control)] overflow-hidden transition-[border-color] duration-[var(--motion-fast)]"
                classList={{
                  "border border-[var(--accent-error)]": !!result().error,
                  "border border-[var(--border)]": !result().error,
                }}
              >
                <span class="pl-3.5 pr-2 text-[var(--text-muted)] font-mono text-[var(--fs-body)] select-none">
                  /
                </span>

                <input
                  id="regex-pattern"
                  aria-invalid={!!result().error || undefined}
                  aria-describedby={result().error ? "regex-error" : undefined}
                  autocapitalize="off"
                  name="regex-pattern"
                  type="text"
                  value={pattern()}
                  onInput={(e) => setPattern(e.currentTarget.value)}
                  placeholder={EXAMPLE_REGEX_PATTERN}
                  spellcheck={false}
                  autocomplete="off"
                  class="min-w-0 flex-1 py-2.5 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono text-[var(--fs-body)]"
                />

                <span class="pr-3 text-[var(--text-muted)] font-mono text-[var(--fs-body)] select-none">
                  /
                </span>
              </div>
              <fieldset
                aria-label="Regex flags"
                class="m-0 flex min-w-0 flex-wrap items-center gap-2 border-0 p-0"
              >
                <For each={ALL_FLAGS}>
                  {(flag) => (
                    <ToolActionButton
                      title={flag.title}
                      aria-label={flag.title}
                      active={flags().has(flag.key)}
                      variant="toggle"
                      onClick={() => toggleFlag(flag.key)}
                      class="min-w-11 font-mono"
                    >
                      {flag.label}
                    </ToolActionButton>
                  )}
                </For>
              </fieldset>
            </div>
            <div class="flex flex-col gap-1.5">
              <ToolInputPanel
                compact
                label="Test string"
                name="regex-test-string"
                autocomplete="off"
                value={input()}
                onInput={setInput}
                placeholder={EXAMPLE_TEXT}
                rows={6}
                spellcheck={false}
              />
            </div>
            <Show when={mode() === "replace"}>
              <Input
                label="Replacement"
                name="regex-replacement"
                autocomplete="off"
                value={replacement()}
                onInput={setReplacement}
                placeholder={EXAMPLE_REGEX_REPLACEMENT}
              />
            </Show>
          </>
        }
        isExample={isExample()}
        status={
          <>
            <Show when={cancelled()}>
              <ToolStatusMessage>
                Matching cancelled. Edit the pattern or test string to try again.
              </ToolStatusMessage>
            </Show>
            <Show when={pending()}>
              <div class="flex flex-wrap items-center gap-2" role="status">
                <span class="text-sm text-[var(--text-muted)]">Matching…</span>
                <ToolActionButton onClick={cancelMatching}>Cancel matching</ToolActionButton>
              </div>
            </Show>
          </>
        }
        error={result().error}
        errorId="regex-error"
      >
        <Show when={!pending() && !cancelled() && effectivePattern() && !result().error}>
          <p class="m-0 text-[var(--fs-control)] text-[var(--text-muted)]">{statusLine()}</p>
        </Show>

        <Show when={isExample() || input().trim()}>
          <div
            class="transition-opacity duration-[var(--motion-base)] ease-[var(--motion-ease-standard)]"
            classList={{ "opacity-40": pending() }}
            aria-busy={pending() || undefined}
          >
            <ToolOutputPanel
              compact
              showExampleNotice={false}
              title={mode() === "replace" ? "Match preview" : "Matches"}
              value={matchesReport()}
              segments={result().highlighted}
              isExample={isExample()}
              copyLabel="Copy matches report"
              download={{ format: "json", fileName: "matches.json" }}
              handoff="json"
            />
          </div>
        </Show>

        <Show
          when={
            mode() === "replace" &&
            (isExample() || input().trim()) &&
            !pending() &&
            !cancelled() &&
            !result().error &&
            !("error" in replaceResult())
          }
        >
          <ToolOutputPanel
            compact
            showExampleNotice={false}
            title="Replaced output"
            value={replaceOutput()}
            copyLabel="Copy replaced output"
            isExample={isExample()}
          />
        </Show>

        <Show when={hasCaptures() && matchCount() > 0}>
          <div
            class="transition-opacity duration-[var(--motion-base)] ease-[var(--motion-ease-standard)]"
            classList={{ "opacity-40": pending() }}
            aria-busy={pending() || undefined}
          >
            <ToolPanel title="Capture groups">
              {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to scroll the capture table. */}
              <section class="overflow-x-auto" aria-label="Capture groups table" tabIndex={0}>
                <table aria-label="Capture groups" class="w-full border-collapse font-mono text-sm">
                  <thead>
                    <tr>
                      <th class="px-[var(--space-3)] py-[var(--space-2)] text-left text-[var(--text-muted)] font-semibold border-b border-[var(--border)] whitespace-nowrap">
                        Match #
                      </th>
                      <th class="px-[var(--space-3)] py-[var(--space-2)] text-left text-[var(--text-muted)] font-semibold border-b border-[var(--border)]">
                        Full match
                      </th>
                      <For each={numberedGroups()}>
                        {(number) => (
                          <th
                            scope="col"
                            class="px-[var(--space-3)] py-[var(--space-2)] text-left text-[var(--text-muted)] font-semibold border-b border-[var(--border)] whitespace-nowrap"
                          >
                            Group {number}
                          </th>
                        )}
                      </For>
                      <For each={namedGroupNames()}>
                        {(name) => (
                          <th
                            scope="col"
                            class="px-[var(--space-3)] py-[var(--space-2)] text-left text-[var(--accent-primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap"
                          >
                            {name} (alias)
                          </th>
                        )}
                      </For>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={result().matches}>
                      {(match: MatchResult, index) => (
                        <tr>
                          <td class="px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-muted)] border-b border-[var(--border)] whitespace-nowrap">
                            {index() + 1}
                          </td>
                          <td class="px-[var(--space-3)] py-[var(--space-2)] align-top text-[var(--text-primary)] border-b border-[var(--border)] break-words min-w-0">
                            <div class="flex items-start gap-2">
                              <span class="min-w-0 flex-1 break-words">{match.fullMatch}</span>
                              <Show when={!isExample()}>
                                <CopyButton
                                  compact
                                  text={match.fullMatch}
                                  label={`Copy match ${index() + 1}`}
                                />
                              </Show>
                            </div>
                          </td>
                          <For each={numberedGroups()}>
                            {(number) => <CaptureCell value={match.groups[number - 1]?.value} />}
                          </For>
                          <For each={namedGroupNames()}>
                            {(name) => (
                              <CaptureCell
                                value={
                                  match.namedGroups.find((group) => group.name === name)?.value
                                }
                              />
                            )}
                          </For>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </section>
            </ToolPanel>
          </div>
        </Show>
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
