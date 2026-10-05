import { createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import ToolActionButton from "@/components/ToolActionButton";
import ToolDownloadButton from "@/components/ToolDownloadButton";
import ToolHandoffButton from "@/components/ToolHandoffButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import ToolContainer from "@/components/tool/ToolContainer";
import ToolInputPanel from "@/components/tool/ToolInputPanel";
import ToolInspectorWorkspace from "@/components/tool/ToolInspectorWorkspace";
import ToolOutputPanel from "@/components/tool/ToolOutputPanel";
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
    <td class="px-4 py-1.5 text-[var(--text-primary)] border-b border-[var(--border)] whitespace-nowrap">
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
    setAnalysis(emptyAnalysis);
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
  const replaceCount = createMemo(() => {
    const current = replaceResult();
    return "error" in current ? 0 : current.replacements;
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
                class="flex items-center bg-[var(--bg-secondary)] rounded-lg overflow-hidden transition-[border-color] duration-150"
                classList={{
                  "border border-[var(--accent-error)]": !!result().error,
                  "border border-[var(--border)]": !result().error,
                }}
              >
                <span class="pl-3.5 pr-2 text-[var(--text-muted)] font-mono text-lg select-none">
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
                  class="min-w-0 flex-1 py-2.5 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono text-[0.9375rem]"
                />

                <span class="pr-3 text-[var(--text-muted)] font-mono text-lg select-none">/</span>
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
          <div class="flex gap-3 flex-wrap">
            <ToolStatusMessage tone={matchCount() > 0 ? "success" : "muted"}>
              {matchCount() === 0
                ? "No matches"
                : `${matchCount()} ${matchCount() === 1 ? "match" : "matches"}`}
            </ToolStatusMessage>
            <ToolStatusMessage tone="muted">
              {result().summary.captureGroupCount} capture{" "}
              {result().summary.captureGroupCount === 1 ? "group" : "groups"}
            </ToolStatusMessage>
            <Show when={result().summary.emptyMatchCount > 0}>
              <ToolStatusMessage tone="warning">
                {result().summary.emptyMatchCount} empty
                {result().summary.emptyMatchCount === 1 ? " match" : " matches"}
              </ToolStatusMessage>
            </Show>
            <Show when={!isExample()}>
              <CopyButton text={matchesReport()} label="Copy matches report" />
              <ToolDownloadButton
                value={matchesReport()}
                format="json"
                fileName="matches.json"
                label="Download matches"
              />
              <ToolHandoffButton value={matchesReport()} format="json" />
            </Show>
            <Show when={result().summary.firstMatchIndex !== null}>
              <ToolStatusMessage tone="muted">
                First match at index {result().summary.firstMatchIndex}
              </ToolStatusMessage>
            </Show>
          </div>
        </Show>

        <Show when={isExample() || input().trim()}>
          <Card class="overflow-hidden p-0">
            <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
              <Label>{mode() === "replace" ? "Match preview" : "Matches"}</Label>
              <Show
                when={!pending() && !cancelled() && effectivePattern() && !result().error}
                fallback={<span class="text-xs text-[var(--text-muted)]">—</span>}
              >
                <span
                  class="text-xs font-semibold"
                  classList={{
                    "text-[var(--accent-success)]": matchCount() > 0,
                    "text-[var(--text-muted)]": matchCount() === 0,
                  }}
                >
                  {mode() === "replace"
                    ? `${replaceCount()} ${replaceCount() === 1 ? "replacement" : "replacements"}`
                    : matchCount() === 0
                      ? "No matches"
                      : matchCount() === 1
                        ? "1 match"
                        : `${matchCount()} matches`}
                </span>
              </Show>
            </div>

            <pre class="m-0 p-4 overflow-x-auto text-sm leading-relaxed text-[var(--text-primary)] font-mono whitespace-pre-wrap break-all">
              <For each={result().highlighted}>
                {(segment) => (
                  <Show when={segment.kind === "match"} fallback={<span>{segment.text}</span>}>
                    <mark class="rounded-[2px] bg-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] text-inherit">
                      {segment.text}
                    </mark>
                  </Show>
                )}
              </For>
            </pre>
          </Card>
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
          <Card class="overflow-hidden p-0">
            <div class="px-4 py-2 border-b border-[var(--border)]">
              <Label>Capture groups</Label>
            </div>

            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to scroll the capture table. */}
            <section class="overflow-auto" aria-label="Capture groups table" tabIndex={0}>
              <table aria-label="Capture groups" class="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr>
                    <th class="px-4 py-2 text-left text-[var(--text-muted)] font-semibold border-b border-[var(--border)] whitespace-nowrap">
                      Match #
                    </th>
                    <th class="px-4 py-2 text-left text-[var(--text-muted)] font-semibold border-b border-[var(--border)]">
                      Full match
                    </th>
                    <For each={numberedGroups()}>
                      {(number) => (
                        <th
                          scope="col"
                          class="px-4 py-2 text-left text-[var(--text-muted)] font-semibold border-b border-[var(--border)] whitespace-nowrap"
                        >
                          Group {number}
                        </th>
                      )}
                    </For>
                    <For each={namedGroupNames()}>
                      {(name) => (
                        <th
                          scope="col"
                          class="px-4 py-2 text-left text-[var(--accent-primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap"
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
                        <td class="px-4 py-1.5 text-[var(--text-muted)] border-b border-[var(--border)] whitespace-nowrap">
                          {index() + 1}
                        </td>
                        <td class="px-4 py-1.5 text-[var(--text-primary)] border-b border-[var(--border)] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                          <div class="flex items-center gap-2">
                            <span class="flex-1 overflow-hidden text-ellipsis">
                              {match.fullMatch}
                            </span>
                            <Show when={!isExample()}>
                              <CopyButton
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
                              value={match.namedGroups.find((group) => group.name === name)?.value}
                            />
                          )}
                        </For>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </section>
          </Card>
        </Show>
      </ToolInspectorWorkspace>
    </ToolContainer>
  );
}
